import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useState, useEffect, useMemo } from "react";
import io from 'socket.io-client'

const socket = io.connect('http://localhost:3000/');

function App() {
  const [isConnectingSocket, setIsConnectingSocket] = useState(false);
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState('normal');

  useEffect(() => {
    socket.on('recieve_message', (_count) => {
      setCount(_count);
      setStatus('normal');
    });
    socket.on('pending', () => {
      setStatus('pending');
    });
    socket.on('error', () => {
      setStatus('error');
    });
    socket.on('connected', () => {
      setIsConnectingSocket(true);
    })
  }, [socket])

  const onSave = async () => {
    const query =  {message, messageId: Date.now()};
    socket.emit('new_message', query);
    setMessage('');
  }

  const displayContent = useMemo(() => ( <div style={{margin: '32px 0 0 64px', display: 'flex', flexDirection: 'column'}}>
    {status === 'normal' && (count === 0 ? 'You did not publish any message yet':`You published ${count} messages`)}
    {status === 'pending' && 'Your message is pending in the server.'}
    {status === 'error' && 'An error accour while saving your message, your message has not been saved!'}
</div>), [count, status]);

  return (
    <div>
      {isConnectingSocket? <div>
       {status === 'normal'&& <div
          style={{margin: "64px 0 0 64px", width: "100%", display: 'flex'}}
        >
          <TextField sx={{ width: "80%", alignSelf: 'center'}} label="Enter your message" variant="outlined" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={() => onSave()} disabled={!message} style={{marginLeft: 32}} variant={'contained'}>Save</Button>
        </div>}
        {displayContent}
      </div>: <div style={{margin: '32px 0 0 64px'}}>There is no connection to server</div>}
    </div>
  );
}

export default App;
