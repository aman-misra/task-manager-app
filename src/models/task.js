import mongoose from 'mongoose'

const taskSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true,
  },
  completed: { 
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
    // ref is used to link this schema with the User schema
    // now we can populate the user info due to ref
  }
}, {
  timestamps: true
})

export const Task = mongoose.model("Task", taskSchema );
