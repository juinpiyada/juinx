import axios from 'axios';

async function createIssue() {
  try {
    const formData = new FormData();
    formData.append('user_id', 1);
    formData.append('title', 'Printer not working');
    formData.append('description', 'The printer in lab 3 is jammed.');
    formData.append('issue_type', 'it');
    formData.append('status', 'open');
    // formData.append('attachment', fileInput.files[0]); // optional

    const res = await axios.post('https://juinbackend.vercel.app/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
