const express = require('express');
const pg = require('pg');
const { Client } = pg;
const { readFile } = require('fs');
const { get } = require('http');

const app = express();
const client = new Client({
    user: 'postgres',
    password: 'XJH20040215',
    host: 'localhost',
    port: '5432',
    database: 'library'
});

function convertToPinyin(str) {
    const pinyinMap = {
      '已': 'yi',
      '借': 'jie',
      '出': 'chu',
      '在': 'zai',
      '架': 'jia',
    };
    let pinyinStr = '';
    
    for (let char of str) {
      if (pinyinMap[char]) {
        pinyinStr += pinyinMap[char];
      } else {
        // 如果没有对应的拼音，则直接丢弃
        // pinyinStr += char;
      }
    }
    
    return pinyinStr;
}

async function connectToPostgres() {
    await client.connect();
    console.log('Connected to PostgreSQL');
}

async function checkCredentials(name, password) {
    const query = {
        text: 'SELECT * FROM people WHERE name = $1 AND password = $2',
        values: [name, password]
    };
    
    const res = await client.query(query);
    return res.rows.length > 0;
}

async function getBookDetails(bookName) {
    const query = {
        text: 'SELECT * FROM book WHERE name = $1',
        values: [bookName]
    };
    
    const res = await client.query(query);
    return res.rows;
}

connectToPostgres();

app.get('/', (req, res) => {
    readFile('./login.html', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});


let isAuthenticated = false;
const userData = {
    id: 0,
    name : '',
    student_id: '',
};


const querycount = {
    text: 'SELECT COUNT(*) AS count FROM form;',
};
function getCount() {
    return new Promise((resolve, reject) => {
        client.query(querycount)
            .then(result => {
                resolve(result.rows[0].count);
            })
            .catch(error => {
                reject(error);
            });
    });
}
(async () => {
    try {
        userData.id = await getCount();
    } catch (error) {
        console.error('查询出错:', error);
    }
})();


app.get('/login', async (req, res) => {
    const name = req.query.name;
    const password = req.query.password;
    userData.name = name;
    
    if (!name || !password) {
        res.send('请输入用户名和密码');
        return;
    }
    isAuthenticated = await checkCredentials(name, password);
    if (isAuthenticated) {
        res.send('欢迎');
    } else {
        res.send('密码错误');
    }
});


app.get('/home', async (req, res) => {
    readFile('./home.html', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
    const queryid = {
        text: 'SELECT id FROM people WHERE name = $1',
        values: [userData.name]
    };
    function getId() {
        return new Promise((resolve, reject) => {
            client.query(queryid)
                .then(result => {
                    resolve(result.rows[0].id);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    (async () => {
        try {
            userData.student_id = await getId();
        } catch (error) {
            console.error('查询出错:', error);
        }
    })();
}),

app.get('/home/query', async (req, res) => {
    if (!isAuthenticated) {
        res.send('请先登录');
        return;
    }
    const bookName = req.query.bookName;
    
    if (!bookName) {
        res.send('请输入书名');
        return;
    }
    const bookDetails = await getBookDetails(bookName);
    if (bookDetails.length > 0) {
        let result = '';
        for (let row of bookDetails) {
            result += `<p>${row.id} ${row.name} ${row.author} ${row.edition} ${row.status}</p>`;
        }
        res.send(result);
    } else {
        res.send('查找不到');
    }
}),

app.get('/home/borrow', async (req, res) => {
    if (!isAuthenticated) {
        res.send('请先登录');
        return;
    }

    const bookName = req.query.bookName;

    if (!bookName) {
        res.send('请输入书名');
        return;
    }

    try {
        const bookQuery = {
            text: 'SELECT * FROM book WHERE name = $1',
            values: [bookName]
        };

        const bookResult = await client.query(bookQuery);

        if (bookResult.rows.length === 0) {
            res.send('未找到该书籍。');
            return;
        }

        const book = bookResult.rows[0];
        pinyin = convertToPinyin(book.status)
        if (pinyin.localeCompare('yijiechu')==0) {
            res.send('该书籍已借出，无法借阅。');
        }
        else if (pinyin.localeCompare('zaijia')==0) {
            const updateQuery = {
                text: 'UPDATE book SET status = $1 WHERE name = $2',
                values: ['已借出', bookName]
            };

            await client.query(updateQuery);
            res.send('书籍状态已更新为已借出，并已添加记录到表单。');
            
            console.log(userData.id)
            console.log(userData.name)
            console.log(userData.student_id)
            // const insertCommand = {
            //     text: 'INSERT INTO form (id, name, student_id, book, status, time) VALUES',
            //     values: ['已借出', bookName]
            // };
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('服务器错误');
    }
});

app.get('/home/return', async (req, res) => {
    if (!isAuthenticated) {
        res.send('请先登录');
        return;
    }

    const bookName = req.query.bookName;

    if (!bookName) {
        res.send('请输入书名');
        return;
    }

    try {
        const bookQuery = {
            text: 'SELECT * FROM book WHERE name = $1',
            values: [bookName]
        };

        const bookResult = await client.query(bookQuery);

        if (bookResult.rows.length === 0) {
            res.send('未找到该书籍。');
            return;
        }

        const book = bookResult.rows[0];
        pinyin = convertToPinyin(book.status)
        if (pinyin.localeCompare('zaijia')==0) {
            res.send('该书籍在架，无法归还。');
        }
        else if (pinyin.localeCompare('yijiechu')==0) {
            const updateQuery = {
                text: 'UPDATE book SET status = $1 WHERE name = $2',
                values: ['在架', bookName]
            };

            await client.query(updateQuery);
            res.send('书籍状态已更新为在架，并已添加记录到表单。');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('服务器错误');
    }
});


app.get('/sign', async (req, res) => {
    readFile('./sign.html', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
}),


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});