const express = require('express');
const pg = require('pg');
const { Client } = pg;
const { readFile } = require('fs');

const app = express();
const client = new Client({
    user: 'postgres',
    password: '0.0',
    host: 'localhost',
    port: '5432',
    database: 'library'
});

// 连接到 PostgreSQL 数据库
async function connectToPostgres() {
    await client.connect();
    console.log('Connected to PostgreSQL');
}

// 检查用户凭证是否存在
async function checkCredentials(name, password) {
    const query = {
        text: 'SELECT * FROM people WHERE name = $1 AND password = $2',
        values: [name, password]
    };
    
    const res = await client.query(query);
    return res.rows.length > 0;
}

// 注册新用户
async function registerUser(name, password) {
    const query = {
        text: 'SELECT * FROM people WHERE name = $1',
        values: [name]
    };
    const res = await client.query(query);

    if (res.rows.length > 0) {
        // 如果用户名已存在，返回 false
        return false;
    } else {
        // 如果用户名不存在，则插入新用户
        const insertQuery = {
            text: 'INSERT INTO people (name, password) VALUES ($1, $2)',
            values: [name, password]
        };
        await client.query(insertQuery);
        return true;
    }
}

// 连接数据库
connectToPostgres();

// 根路由，返回登录页面
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

// 登录路由
app.get('/login', async (req, res) => {
    const name = req.query.name;
    const password = req.query.password;
    
    if (!name || !password) {
        res.send('请输入用户名和密码');
        return;
    }
    const isAuthenticated = await checkCredentials(name, password);
    if (isAuthenticated) {
        res.send('欢迎');
    } else {
        res.send('密码错误');
    }
});

// 注册路由
app.get('/register', (req, res) => {
    readFile('./register.html', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});

// 处理注册请求
app.post('/register', async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        res.send('请输入用户名和密码');
        return;
    }

    const success = await registerUser(name, password);
    if (success) {
        // 注册成功后重定向到登录页面
        res.send('<p>注册成功! <a href="/">返回登录</a></p>');
    } else {
        res.send('该用户名已存在');
    }
});

// 主页路由
app.get('/home', async (req, res) => {
    readFile('./home.html', 'utf-8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        } else {
            res.send(data);
        }
    });
});

// 图书查询
app.get('/home/query', async (req, res) => {
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
});

// 借书功能
app.get('/home/borrow', async (req, res) => {
    const bookName = req.query.bookName;

    if (!bookName) {
        res.send('请输入书名');
        return;
    }

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
    if (pinyin === 'yijiechu') {
        res.send('该书籍已借出，无法借阅。');
    } else if (pinyin === 'zaijia') {
        const updateQuery = {
            text: 'UPDATE book SET status = $1 WHERE name = $2',
            values: ['已借出', bookName]
        };

        await client.query(updateQuery);
        res.send('书籍状态已更新为已借出。');
    }
});

// 还书功能
app.get('/home/return', async (req, res) => {
    const bookName = req.query.bookName;

    if (!bookName) {
        res.send('请输入书名');
        return;
    }

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
    if (pinyin === 'zaijia') {
        res.send('该书籍在架，无法归还。');
    } else if (pinyin === 'yijiechu') {
        const updateQuery = {
            text: 'UPDATE book SET status = $1 WHERE name = $2',
            values: ['在架', bookName]
        };

        await client.query(updateQuery);
        res.send('书籍状态已更新为在架。');
    }
});

// 启动服务器
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
