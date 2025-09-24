import { encryptAndPreparePayload } from './crypto.js';
import './style.css';

// --- CONFIGURATION ---
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

// --- DOM Element References ---
const secretForm = document.getElementById('secret-form');
const secretContent = document.getElementById('secret-content');
const beneficiaryContact = document.getElementById('beneficiary-contact');
const recoveryPassword = document.getElementById('recovery-password');
const gracePeriod = document.getElementById('grace-period');
const resultMessage = document.getElementById('result-message');
const submitButton = secretForm.querySelector('button');
const titularAlertContact = document.getElementById('titular-alert-contact');

// --- Form Logic ---
secretForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // Prevent the page from reloading

  // Disable the button to prevent multiple submissions
  submitButton.disabled = true;
  submitButton.innerText = 'Encrypting & Storing...';
  resultMessage.style.display = 'none';

  try {
    // 1. Read values from the form inputs
    const secret = secretContent.value;
    const beneficiary = beneficiaryContact.value;
    const password = recoveryPassword.value;
    const gracePeriodSeconds = parseInt(gracePeriod.value, 10);
    const ownerEmail = titularAlertContact.value;

    // 2. Execute the entire cryptographic process from your diagram
    console.log('Initiating cryptographic process...');
    const cryptoPayload = await encryptAndPreparePayload(secret, password);
    console.log('Cryptographic process complete. Payload generated:', cryptoPayload);

    // 3. Build the final request body for the API
    const apiPayload = {
      ...cryptoPayload,
      beneficiaryContact: beneficiary,
      gracePeriodSeconds: gracePeriodSeconds,
      titularAlertContact: ownerEmail,
    };
    const fetchBody = JSON.stringify(apiPayload);
    console.log('Fetch body string:', fetchBody);

    // 4. Send the encrypted data to the Posterit-E API
    console.log('Sending payload to the API...');
    const response = await fetch(`${API_URL}/secrets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: fetchBody,
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle API errors (4xx, 5xx responses)
      throw new Error(responseData.message || `Server Error: ${response.status}`);
    }

    // 5. Display a success message
    console.log('Success:', responseData);
    resultMessage.innerText = `Success! Your secret has been stored securely. Secret ID: ${responseData.secretId}`;
    resultMessage.style.color = 'green';
    secretForm.reset(); // Clear the form for the next use

  } catch (error) {
    // 6. Handle any errors from the crypto or API calls
    console.error('An error occurred:', error);
    resultMessage.innerText = `Error: ${error.message}`;
    resultMessage.style.color = 'red';
  } finally {
    // 7. Re-enable the button
    submitButton.disabled = false;
    submitButton.innerText = 'Encrypt and Store Secret';
    resultMessage.style.display = 'block';
  }
});