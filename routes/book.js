const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const pageSize = 10; // 適切なページサイズに変更する

const loginCheck = (req, res, next) => {
    if (!req.user) {
        req.session.returnTo = "/book";
        res.redirect("/users/login");
        return;
    }
    next();
};

/**
 * 書籍一覧ページ
 */
router.get("/list",
    loginCheck,
    async (req, res, next) => {
        try {
            // ページ番号をクエリパラメータから取得。なければデフォルトは 1
            const page = +req.query.page || 1;

            // 書籍一覧を取得
            const books = await prisma.books.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: [
                    { id: "asc" } // 適切な orderBy の指定が必要
                ],
            });

            // JSON形式でクライアントに返す
            res.status(200).json({ books });
        } catch (error) {
            // エラーが発生した場合はエラーレスポンスを返す
            console.error('Error fetching books:', error);
            res.status(500).json({ error: 'Error fetching books' });
        } finally {
            await prisma.$disconnect();
        }
    });


/**
 * 書籍詳細ページ
 */
router.get("/detail/:id",
    loginCheck,
    async (req, res, next) => {

        const uid = +req.params.uid;
        const page = +req.params.page || 1;
        // ユーザID(uid)とページ番号(page)を使ってデータ取ってくる。
        const books = await prisma.books.findMany({
            where: {accountId: uid},
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [
                {createdAt: "desc"}
            ]
        });
        // ターゲットのユーザ情報を取ってくる
        const target = await prisma.user.findUnique({
            where: {id: uid},
            select: {
                id: true,
                name: true
            }
        });
        const data = {
            title: "Boards",
            user: req.user,
            target,
            content: messages,
            page,
        };
        res.render("board/home", data);
    });



module.exports = router;
