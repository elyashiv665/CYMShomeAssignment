import mongoose from 'mongoose';
import {connect, createChannel, declareQueue} from './utils/rabbitMq/rabbitMQ.js';
import express from 'express';

// Connect to MongoDB database
mongoose
  .connect('mongodb://mongo/domains')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));
 
let channel;
connect().then(async(connection) => {
    channel = await createChannel(connection);
  })
  .catch((error) => console.error('Error connecting to rabbitmq:', error));
  

const app = express();
const port = 3000;

app.use(express.urlencoded());
app.use(express.json());  


app.post('/message', async (req, res) => {
    const message = req.body?.message;
    if(!message){
        console.error('No message specified');
        res.json({
            statusCode: 400,
            message: 'No message specified'
        })
        return;
    }

    if(!channel){
        console.log('no connection');
        res.json({statusCode: 500, message: 'connection error'})
        return;
    }

    try{
        const existMessagesQueue = await channel.assertQueue(process.env.MESSAGES_QUEUE_NAME)
        if(!existMessagesQueue){
            await declareQueue(channel, process.env.UPDATE_DATA_QUEUE_NAME);
        }
    }catch(error){
        console.error('Error creating queue');
        res.json({statusCode: 500, message: 'connection error'});
        return;
    }
    try{
        const task = {
            data: {
              message
            }
        };
        publishToQueue(channel, process.env.MESSAGES_QUEUE_NAME, task)
        res.json({statusCode: 201, message: 'Successfully save message.'})
    }catch(err){
        console.log('error publish to queue')
    }
});

app.listen(port, async(err) => {
    if (err) {
        console.log("Error in server setup")
        console.error(error);
        await channel.close();
        await connection.close();
    }
    console.log(`Server is running on port ${port}`);
});

