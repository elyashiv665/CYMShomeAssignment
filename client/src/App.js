import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useState } from "react";


function App() {
  const [message, setMessage] = useState('');
  const [count, setCount] = useState(0);
  
  const onSave = (message) => {
    console.log('message', message);
    setMessage('');
  }

  return (
    <div>
      <div
        style={{margin: "64px 0 0 64px", width: "100%", display: 'flex'}}
      >
        <TextField sx={{ width: "80%", alignSelf: 'center'}} label="Enter your message" variant="outlined" value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button onClick={() => onSave(message)} disabled={!message} style={{marginLeft: 32}} variant={'contained'}>Save</Button>
      </div>
      <div style={{margin: '32px 0 0 64px'}}>
        {count === 0 ? 'You did not publish any message yet':`You published ${count} messages`}
      </div>
    </div>
  );
}

export default App;
