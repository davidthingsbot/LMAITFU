// LMAITFU - Let Me AI That For You
// Client-side AI query animator

(function() {
    'use strict';

    // DOM Elements
    const setupMode = document.getElementById('setup-mode');
    const animationMode = document.getElementById('animation-mode');
    const keyRequiredMode = document.getElementById('key-required-mode');
    
    const apiProvider = document.getElementById('api-provider');
    const apiKey = document.getElementById('api-key');
    const questionInput = document.getElementById('question');
    const generateBtn = document.getElementById('generate-btn');
    const linkResult = document.getElementById('link-result');
    const generatedLink = document.getElementById('generated-link');
    const copyBtn = document.getElementById('copy-btn');
    
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const snarkMessage = document.getElementById('snark-message');
    
    const viewerProvider = document.getElementById('viewer-provider');
    const viewerKey = document.getElementById('viewer-key');
    const viewerContinueBtn = document.getElementById('viewer-continue-btn');

    // Load saved API key
    const savedProvider = localStorage.getItem('lmaitfu_provider');
    const savedKey = localStorage.getItem('lmaitfu_key');
    if (savedProvider) apiProvider.value = savedProvider;
    if (savedKey) apiKey.value = savedKey;

    // Check if we're in view mode (URL has query)
    const urlParams = new URLSearchParams(window.location.search);
    const encodedQuery = urlParams.get('q');
    
    if (encodedQuery) {
        // View mode - play the animation
        startViewMode(encodedQuery);
    }

    // Event Listeners
    generateBtn.addEventListener('click', generateLink);
    copyBtn.addEventListener('click', copyLink);
    viewerContinueBtn.addEventListener('click', () => {
        const key = viewerKey.value.trim();
        const provider = viewerProvider.value;
        if (key) {
            localStorage.setItem('lmaitfu_key', key);
            localStorage.setItem('lmaitfu_provider', provider);
            keyRequiredMode.classList.add('hidden');
            playAnimation(currentQuery, provider, key);
        }
    });

    // Save API key on change
    apiKey.addEventListener('change', () => {
        localStorage.setItem('lmaitfu_key', apiKey.value);
    });
    apiProvider.addEventListener('change', () => {
        localStorage.setItem('lmaitfu_provider', apiProvider.value);
    });

    let currentQuery = '';

    function generateLink() {
        const key = apiKey.value.trim();
        const question = questionInput.value.trim();
        const provider = apiProvider.value;
        
        if (!question) {
            alert('Please enter a question!');
            return;
        }
        
        if (!key) {
            alert('Please enter your API key!');
            return;
        }

        // Encode the question (not the key!)
        const encoded = btoa(encodeURIComponent(question));
        const link = `${window.location.origin}${window.location.pathname}?q=${encoded}`;
        
        generatedLink.value = link;
        linkResult.classList.remove('hidden');
    }

    function copyLink() {
        generatedLink.select();
        document.execCommand('copy');
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
        }, 2000);
    }

    function startViewMode(encodedQuery) {
        setupMode.classList.add('hidden');
        
        try {
            currentQuery = decodeURIComponent(atob(encodedQuery));
        } catch (e) {
            currentQuery = 'What is the meaning of life?';
        }

        // Check if user has an API key saved
        const savedKey = localStorage.getItem('lmaitfu_key');
        const savedProvider = localStorage.getItem('lmaitfu_provider') || 'openai';
        
        if (savedKey) {
            playAnimation(currentQuery, savedProvider, savedKey);
        } else {
            // Show key required screen
            keyRequiredMode.classList.remove('hidden');
        }
    }

    async function playAnimation(query, provider, key) {
        animationMode.classList.remove('hidden');
        keyRequiredMode.classList.add('hidden');
        
        // Update header based on provider
        const providerName = document.querySelector('.provider-name');
        providerName.textContent = provider === 'openai' ? 'ChatGPT' : 'Claude';

        // Clear previous messages
        chatMessages.innerHTML = '';
        
        // Animate typing the question
        await typeInInput(query);
        
        // Small pause, then "send"
        await sleep(500);
        
        // Show user message
        addMessage(query, 'user');
        chatInput.textContent = '';
        
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        
        // Make actual API call
        try {
            const response = await callAI(query, provider, key);
            
            // Remove typing indicator
            typingDiv.remove();
            
            // Show response
            addMessage(response, 'assistant');
            
            // Show snark
            await sleep(1000);
            snarkMessage.classList.remove('hidden');
            
        } catch (error) {
            typingDiv.remove();
            addMessage(`Error: ${error.message}. Maybe try getting your own API key? 😏`, 'assistant');
        }
    }

    function addMessage(text, role) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.innerHTML = `<div class="bubble">${escapeHtml(text)}</div>`;
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function typeInInput(text) {
        chatInput.textContent = '';
        for (let i = 0; i < text.length; i++) {
            chatInput.textContent += text[i];
            await sleep(30 + Math.random() * 40); // Variable typing speed
        }
    }

    async function callAI(query, provider, key) {
        if (provider === 'openai') {
            return callOpenAI(query, key);
        } else {
            return callAnthropic(query, key);
        }
    }

    async function callOpenAI(query, key) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Give concise, direct answers. Keep responses under 200 words unless the question requires more detail.'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async function callAnthropic(query, key) {
        // Note: Anthropic's API doesn't support browser CORS, so this would need a proxy
        // For now, we'll show a helpful message
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: query
                    }
                ],
                system: 'You are a helpful assistant. Give concise, direct answers. Keep responses under 200 words unless the question requires more detail.'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Anthropic API error');
        }

        const data = await response.json();
        return data.content[0].text;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
})();
