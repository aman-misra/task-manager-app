import express from "express";
import { auth } from "../midlleware/auth.js";
import { Task } from "../models/task.js";

const taskRouter = express.Router();

/* ------------------ Create Task -------------------- */

taskRouter.post("/tasks", auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });

  try {
    const data = await task.save();
    res.status(201).send(data);
  } catch (e) {
    res.status(400).send(e);
  }
});

/* ------------------ Get All Tasks -------------------- */

taskRouter.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const sortParam = req.query.sortBy.split("_");
    sort[sortParam[0]] = sortParam[1] === 'asc' ? 1 : -1
  }

  try {
    // const data = await Task.find({owner: req.user._id});
    //  res.send(data)
    //  Or
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

/* ------------------ Get Task by Id -------------------- */

taskRouter.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const data = await Task.findOne({ _id, owner: req.user._id });
    if (!data) {
      return res.status(404).send();
    }
    res.send(data);
  } catch (e) {
    res.status(500).send(e);
  }
});

/* ------------------ Find and Update -------------------- */

taskRouter.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  //error when updating keys which are not present or _id
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(404).send({ error: "Invalid update!" });
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send({ error: "Please authenticate!" });
    }

    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    await task.save();

    res.send(task);
  } catch (e) {
    res.status(400).send({ error: "Please authenticate!" });
  }
});

/* ------------------ Delete -------------------- */

taskRouter.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const data = await Task.findOneAndDelete({ _id, owner: req.user._id });

    if (!data) {
      return res.status(404).send({
        error: "No task present with given id",
      });
    }

    res.send(data);
  } catch (e) {
    res.status(500).send(e);
  }
});

export default taskRouter;
