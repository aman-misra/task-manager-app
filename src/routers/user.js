import express from "express";
import multer from "multer";
import sharp from "sharp";
import { sendCancellationEmail, sendWelcomeEmail } from "../emails/account.js";
import { auth } from "../midlleware/auth.js";
import { User } from "../models/user.js";

const userRouter = express.Router();

/* ------------------ Create User/Signup -------------------- */

userRouter.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/* ------------------ Login -------------------- */

userRouter.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    // res.send({ user: user.getPublicProfile() , token });
    /* Instead of creating getPublicProfile and implementing on each route we have created a function toJSON in user model which removes the password and tokens key from all user routes */
    res.send({ user, token });
  } catch (e) {
    res.status(400).send();
  }
});

/* ------------------ Logout -------------------- */

userRouter.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((tokenItem) => {
      return tokenItem.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/* ------------------ Logout from all devices -------------------- */

userRouter.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

/* ------------------ My Profile -------------------- */

userRouter.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

/* ------------------ Update My Profile -------------------- */

userRouter.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "age", "email", "password"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(404).send({ error: "Invalid update!" });
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();

    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

/* ------------------ Delete My Profile -------------------- */

userRouter.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    sendCancellationEmail(req.user.email, req.user.name);
    res.send(req.user);
  } catch (e) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

/* ------------------ Upload Avatar -------------------- */

//File upload
const upload = multer({
  limits: {
    fileSize: 1000000, // 1 MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload image only"));
    }

    cb(undefined, true);
  },
});

userRouter.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;
    // req.user.avatar = req.file.buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

/* ------------------ Delete Avatar -------------------- */

userRouter.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

/* ------------------ My Avatar -------------------- */

userRouter.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(400).send(e);
  }
});

export default userRouter;
