const express = require("express");
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");
const LocalStrategy = require("passport-local");
const { check, validationResult } = require("express-validator");
const scrypt = require("../util/auth.js");

const router = express.Router();
const prisma = new PrismaClient();

passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await prisma.user.findUnique({ where: { name: username } });

        if (!user) {
          return done(null, false, { message: 'ユーザーが見つかりません' });
        }

        const hashedPassword = scrypt.calcHash(password, user.salt).toString('hex');
        if (hashedPassword !== user.password) {
          return done(null, false, { message: 'パスワードが一致しません' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
));

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user.id, name: user.name });
  });
});

passport.deserializeUser((user, done) => {
  process.nextTick(() => {
    done(null, user);
  });
});

const checkAuthentication = (req, res, next) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({ message: "logged in" });
  } else {
    return res.status(401).json({ message: "unauthenticated" });
  }
};


router.get("/", checkAuthentication, (req, res) => {
  // 必要に応じて追加のロジックを記述
  res.json({ message: "このルートにアクセスできます。" });
});

router.get("/login", (req, res, next) => {
  const data = {
    title: "Users/Login",
    content: "名前とパスワードを入力してください"
  };
  if (req.isAuthenticated()) {
    return res.status(200).json({ message: "OK" , user: req.user});
  } else {
    return res.status(401).json({ message: "name and/or password is invalid"});
  }
});

router.post("/login", passport.authenticate("local", {
  successReturnToOrRedirect: "/users/normally",
  failureRedirect: "/users/error",
  failureMessage: true,
  keepSessionInfo: true
}), (req, res, next) => {
  try {
    // ログイン成功後にユーザー情報を取得
    const user = req.user;

    // ユーザー情報をボードに渡す処理
    const username = user.name;

    // ボードへのリダイレクト
    res.redirect(`/board?username=${username}`);
  } catch (error) {
    console.error('ログイン成功後の処理エラー:', error);
    res.redirect("/users/error");
  }
});

router.get("/error", (req, res, next) => {
  res.json({message: "name and/or password is invalid"})
})

router.get("/normally", (req, res, next) => {
  res.json({message: "OK"})
})

router.get("/logout", (req, res, next) => {
  const LoginInfo = req.query.username

  return res.status(200).json({LoginInfo});
});


/**
 * ユーザ新規作成
 */
router.post("/signup", [
  // 入力値チェックミドルウェア
  check("email").notEmpty({ ignore_whitespace: true }),
  check("name").notEmpty({ ignore_whitespace: true }),
  check("password").notEmpty({ ignore_whitespace: true })
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, name, password } = req.body;
  const salt = generateSalt();
  const hashed = calcHash(password, salt);

  try {
    await prisma.users.create({
      data: {
        email,
        name,
        password: hashed,
        salt: salt
      }
    });
    return res.status(201).json({ message: "created!" });
  } catch (e) {
    switch (e.code) {
      case "P2002":
        return res.status(400).json({ message: "username is already registered" });
      default:
        console.error(e);
        return res.status(500).json({ message: "unknown error" });
    }
  }
});

router.get("/signup", (req, res) => {
  res.render("signup"); // ユーザ登録ページを表示するための処理を追加する
});

// ランダムな文字列を生成する関数
function generateSalt() {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('hex');
}

// パスワードをハッシュ化する関数
function calcHash(password, salt) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex');
}


module.exports = router;
