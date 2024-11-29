const express = require('express');
const pg = require('pg');
const { Client } = pg;
const { readFile } = require('fs');
const { get } = require('http');

const app = express();
const client = new Client({
    user: 'postgres',
    password: '139653',
    host: 'localhost',
    port: '5432',
    database: 'lib'
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

async function checkRegister(id) {
    const query = {
        text: 'SELECT * FROM people WHERE id = $1',
        values: [id]
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

async function registerUser(name, password) {
    const query = {
        text: 'SELECT * FROM people WHERE name = $1',
        values: [name]
    };
    const res = await client.query(query);

    if (res.rows.length > 0) {
        return false;
    } else {
        const insertQuery = {
            text: 'INSERT INTO people (name, password) VALUES ($1, $2)',
            values: [name, password]
        };
        await client.query(insertQuery);
        return true;
    }
}

async function deleteUser(studentId) {
    try {
        // 首先检查用户是否存在
        const checkQuery = {
            text: 'SELECT * FROM people WHERE id = $1',
            values: [studentId]
        };
        const checkResult = await client.query(checkQuery);
        
        if (checkResult.rows.length === 0) {
            return { success: false, message: '用户不存在' };
        }

        // 检查是否试图删除管理员账户
        if (checkResult.rows[0].name === 'Admin') {
            return { success: false, message: '不能删除管理员账户' };
        }

        // 如果用户存在且不是管理员，执行删除操作
        const deleteQuery = {
            text: 'DELETE FROM people WHERE id = $1',
            values: [studentId]
        };
        await client.query(deleteQuery);
        
        return { success: true, message: '用户删除成功' };
    } catch (error) {
        console.error('删除用户时出错:', error);
        return { success: false, message: '删除用户失败' };
    }
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

app.get('/register', async (req, res) => {
    readFile('./register.html', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
}),

app.get('/register/signup', async (req, res) => {
    console.log('222222222')
    const name = req.query.name;
    const id = req.query.id;
    const password = req.query.password;
    const phone = req.query.phone
    console.log(name)
    console.log(id)
    console.log(password)
    console.log(phone)
    is_register = await checkRegister(id);
    if (is_register)
    {
        res.status(400).send('该用户已注册');
    }
    else{
        const insertQuery = {
            text: 'INSERT INTO people (name, id, password, phone) VALUES ($1, $2, $3, $4)',
            values: [name, id, password, phone]
        };
        await client.query(insertQuery);
        res.send('注册成功')
    }
});

app.get('/admin', async (req, res) => {
    console.log('22222222')
    readFile('./admin.html', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });

});

async function deleteDataFromPeopleTable(studentId) {
    const deleteQuery = {
        text: 'DELETE FROM people WHERE student_id = $1',
        values: [studentId]
    };

    try {
        const result = await client.query(deleteQuery);

        if (result.rowCount > 0) {
            console.log(`成功删除student_id为 ${studentId} 的数据`);
        } else {
            console.log(`未找到符合条件的数据`);
        }
    } catch (error) {
        console.error('删除数据时出现错误:', error);
        throw error; // 抛出错误，可以在上层处理
    }
}

app.get('/admin/deleteUser', async (req, res) => {
    console.log('ssssss')
    studentId = req.query.studentId
    console.log(studentId)
    if(!id){
        res.send('请输入学号');
        return;
    }
    deleteDataFromPeopleTable(studentId)
    .then(() => {
        res.json({ message: `成功删除studentId为 ${studentId} 的用户` });
    })
    .catch(error => {
        console.error('删除用户时出错:', error);
        res.status(500).json({ message: '删除用户失败。' });
    });
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
            
            userData.id++
            console.log(userData.id)
            console.log(userData.name)
            console.log(userData.student_id)
            const insertQuery = {
                text: 'INSERT INTO form (id, name, student_id, book, status, time) VALUES ($1, $2, $3, $4, $5, $6)',
                values: [userData.id, userData.name, userData.student_id, bookName, '已借出', '2024-11-29']
            };
            await client.query(insertQuery);
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

            userData.id++
            console.log(userData.id)
            console.log(userData.name)
            console.log(userData.student_id)
            const insertQuery = {
                text: 'INSERT INTO form (id, name, student_id, book, status, time) VALUES ($1, $2, $3, $4, $5, $6)',
                values: [userData.id, userData.name, userData.student_id, bookName, '归还', '2024-11-29']
            };
            await client.query(insertQuery);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('服务器错误');
    }
});

app.delete('/admin/deleteUser', async (req, res) => {
    if (!isAuthenticated) {
        res.status(401).json({ success: false, message: '请先登录' });
        return;
    }

    // 检查是否是管理员
    if (userData.name !== 'Admin') {
        res.status(403).json({ success: false, message: '只有管理员才能删除用户' });
        return;
    }

    const studentId = req.query.studentId;
    
    if (!studentId) {
        res.status(400).json({ success: false, message: '请提供学号' });
        return;
    }

    try {
        const result = await deleteUser(studentId);
        res.json(result);
    } catch (error) {
        console.error('处理删除用户请求时出错:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});