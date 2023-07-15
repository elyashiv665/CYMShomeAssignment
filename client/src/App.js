import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useState, useEffect } from "react";
import io from 'socket.io-client'

const socket = io.connect('http://localhost:3000/');

function App() {
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    socket.on('recieve_message', (data) => {
      data?.count && setCount(data.count);
    });
    socket.on('pending', (data) => {
      setStatus('pending');
    })
  }, [socket])

  const onSave = (message) => {
    socket.emit('new_message', {message});
    setMessage('');
    setStatus('');
  }

  return (
    <div>
      <div
        style={{margin: "64px 0 0 64px", width: "100%", display: 'flex'}}
      >
        <TextField sx={{ width: "80%", alignSelf: 'center'}} label="Enter your message" variant="outlined" value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button onClick={() => onSave(message)} disabled={!message} style={{marginLeft: 32}} variant={'contained'}>Save</Button>
      </div>
      <div style={{margin: '32px 0 0 64px', display: 'flex', flexDirection: 'column'}}>
        {count === 0 ? 'You did not publish any message yet':`You published ${count} messages`}
        {status === 'pending' && 'Your message is pending in the server.'}

      </div>
    </div>
  );
}

export default App;
