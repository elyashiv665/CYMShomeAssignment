import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
data: {
    type: String,
    required: true
}
});

export default mongoose.model('Message', messageSchema);
