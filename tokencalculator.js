const tokenInput = document.getElementById('tokenInput');
const tokenDisplay = document.getElementById('tokenDisplay');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');
const providerSelect = document.getElementById('providerSelect');
const customUrlContainer = document.getElementById('customUrlContainer') 
const modelDiv = document.getElementById('modelDiv')
const authModal = document.getElementById('authModal')
const keyInput = document.getElementById('keyInput')
const cancelAuthButton = document.getElementById('cancelAuthBtn');
const confirmAuthButton = document.getElementById('confirmSendBtn');

const MODEL_PRICING = {
    "gpt-4o-mini": 0.00000015,
    "gpt-4o":      0.00000250,
    "gpt-5.5":     0.00000500,
    "sonnet-4.6":  0.00000300,
    "opus-4.7":    0.00000500,
    "flash-2.5":   0.000000075
};

const PROVIDER_MODELS = {
    openai: ["openai/gpt-4o-mini", "openai/gpt-4o", "openai/gpt-5.5"],
    anthropic: ["anthropic/sonnet-4.6", "anthropic/opus-4.7"],
    gemini: ["gemini/flash-2.5"]
};

const PROVIDER_URLS = {
    openai:    "https://api.openai.com/v1/chat/completions",
    anthropic: "https://api.anthropic.com/v1/messages",
    gemini:    "https://generativelanguage.googleapis.com/v1beta/models" 
};

let pipeLineGate = {
    isSending : false
}

document.addEventListener('DOMContentLoaded', () => {
    const lifetimeDisplay = document.getElementById('lifetimeDisplay');
    const savedSpend = localStorage.getItem('lifetimeSpend') || 0;
    const totalFloat = parseFloat(savedSpend);
    lifetimeDisplay.textContent = `Lifetime Cost: $${totalFloat.toFixed(6)}`;
})

async function providerDropdown(){

    const providerInput = providerSelect.value;
    const selectedProviderArray = PROVIDER_MODELS[providerInput];
    customUrlContainer.style.display = 'none';
    modelDiv.style.display = 'block';
    modelSelect.innerHTML = '';
    if (selectedProviderArray){
        selectedProviderArray.forEach(models=>{
        const option = document.createElement('option');
        option.textContent = models
        option.value = models;
        modelSelect.appendChild(option)

    })}else {
        customUrlContainer.style.display = 'block';
        modelDiv.style.display = 'none';
    }
    await calculateToken();
}

async function calculateToken(){
    const promptText = tokenInput.value;
    const modelInput = modelSelect.value
   
    if(!promptText.trim()){
        tokenDisplay.textContent = 0;
        return
    }
    const wordCount = promptText.trim().split(/\s+/).length
    const tokenEstimate = Math.ceil(wordCount * 1.33);
    if(providerSelect.value === 'custom'){
        tokenDisplay.textContent = `Estimated cost: Host Dependent | Estimated Token: ${tokenEstimate}`
    }


    const pricePerToken = MODEL_PRICING[modelInput]?? 0; 
    const costEstimate = tokenEstimate * pricePerToken;
    tokenDisplay.textContent = `Estimated Cost:$${costEstimate.toFixed(6)} | Estimated Tokens:${tokenEstimate}`;
}
async function sendToLLM(){
    if (pipeLineGate.isSending === true) return;
    sendBtn.disabled = true;
    pipeLineGate.isSending = true;

    const keyValue = keyInput.value;
    authModal.style.display = 'none';
    if (!keyValue){
                authModal.style.display = 'flex';
        sendBtn.disabled = false;
        pipeLineGate.isSending = false;
        return
    }
    authModal.style.display = 'none'

    let selectedUrl = '';
    const providerInput = providerSelect.value;
    const promptText = tokenInput.value;

    if (providerInput === 'custom'){
        selectedUrl = document.getElementById('urlInput').value
    }else{
        selectedUrl = PROVIDER_URLS[providerInput]; 
    }
    try{
        const networkResponse = await fetch(selectedUrl,{
            method : 'POST',
            headers : {
                'Content-Type' : 'application/json',
                'Authorization' : `Bearer ${keyValue}`,
                'HTTP-Referer' : window.location.href,
                'X-Title' : 'Enhanced Token Gateway',
            },
            body : JSON.stringify({
                model : modelSelect.value || 'openai/gpt-4o-mini',
                messages : [
                    {role: 'system', content: 'You are a helpful assistant'},
                     {role: 'user', content : promptText}
                ]
            })           
        })
        if (!networkResponse.ok){
            throw new Error(`Failed to connect - Try again later ${networkResponse.status}`)
        }

        console.log('Tranmission received from backend')
        const responseData = await networkResponse.json();
        const aiReplyText = responseData.choices?.[0].message?.content || 'No response from AI';

        const responseContainer = document.getElementById('responseContainer');
        const responseText = document.getElementById('responseText');
        responseContainer.style.display = 'block';
        responseText.textContent = aiReplyText;


        const wordCount = promptText.trim().split(/\s+/).length
        const tokenEstimate = Math.ceil(wordCount * 1.33);
        const pricePerToken = MODEL_PRICING[modelSelect.value]?? 0; 
        const currentTransactionCost = tokenEstimate * pricePerToken;
        const oldSpend = localStorage.getItem('lifetimeSpend') || 0;
        const newTotalSpend = parseFloat(oldSpend) + currentTransactionCost;
        localStorage.setItem('lifetimeSpend', newTotalSpend.toFixed(6));
        document.getElementById('lifetimeDisplay').textContent = `Lifetime Cost: $${newTotalSpend.toFixed(6)}`;
    }catch(error){
        console.log('Error Message:',error.message)
        const errorAlert = document.getElementById('errorAlert');
        if (errorAlert) {
            errorAlert.textContent = `Error: ${error.message}`;
            errorAlert.style.display = 'block';
        }
    }finally{
        sendBtn.disabled = false;
        pipeLineGate.isSending = false;
    }   
   
    
}

function closeAuthenicationMOdal (){
    authModal.style.display = 'none'
}

tokenInput.addEventListener('input', calculateToken )
modelSelect.addEventListener('change', calculateToken)
providerSelect.addEventListener('change', providerDropdown)
sendBtn.addEventListener('click', sendToLLM)
cancelAuthButton.addEventListener('click', closeAuthenicationMOdal)
confirmAuthButton.addEventListener('click', sendToLLM)