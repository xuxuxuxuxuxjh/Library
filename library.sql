-- 书标号、书名、作者、版本、状态（在架/已借出）
create table book (
   id            INT                 not null,
   name          CHAR(40)            not null,
   author        CHAR(40)             not null,
   edition       CHAR(40)             null,
   status        CHAR(40)             not null,
   constraint PK_BOOK primary key (id)
);

INSERT INTO book (id, name, author, edition, status) VALUES
(1, '《红楼梦》', '曹雪芹', '第三版', '在架'),
(2, '《百年孤独》', '加西亚·马尔克斯', '第五版', '已借出'),
(3, '《三体》', '刘慈欣', '第一版', '在架'),
(4, '《解忧杂货店》', '东野圭吾', '第二版', '在架'),
(5, '《挪威的森林》', '村上春树', '第四版', '在架'),
(6, '《活着》', '余华', '第七版', '已借出'),
(7, '《追风筝的人》', '卡勒德·胡赛尼', '第二版', '在架'),
(8, '《哈利·波特与魔法石》', 'J.K.罗琳', '第五版', '在架'),
(9, '《小王子》', '圣埃克苏佩里', '第八版', '在架'),
(10, '《悲惨世界》', '维克多·雨果', '第三版', '在架'),
(11, '《1984》', '乔治·奥威尔', '第一版', '已借出'),
(12, '《动物农场》', '乔治·奥威尔', '第六版', '在架'),
(13, '《骆驼祥子》', '老舍', '第二版', '在架'),
(14, '《茶馆》', '老舍', '第一版', '在架');


-- 姓名、学号、密码、电话
create table people (
   name            CHAR(40)             not null,
   id              CHAR(40)             not null,
   password        CHAR(40)             not null,
   phone           CHAR(40)             not null,
   constraint PK_PEOPLE primary key (id)
);

INSERT INTO people (name, id, password, phone) VALUES
('张三', '100020', '123456', '13012345678'),
('李四', '200120', '123456', '13112345678'),
('王五', '510000', '123456', '13212345678'),
('赵六', '518000', '123456', '13312345678'),
('Admin', '11111', '666666', '13412345678');


-- 编号、姓名、学号、书籍、状态（借阅/归还）、时间
create table form (
   id              INT                  not null,
   name            CHAR(40)             not null,
   student_id      CHAR(40)             not null,
   book            CHAR(40)             not null,
   status          CHAR(40)             not null,
   time           CHAR(40)             not null,
   constraint PK_FORM primary key (id)
);

INSERT INTO form (id, name, student_id, book, status, time) VALUES
(1, '张三', '100020', '《百年孤独》', '借阅', '2024-11-10'),
(2, '李四', '200120', '《活着》', '借阅', '2024-11-11'),
(3, '王五', '510000', '《1984》', '借阅', '2024-11-12');