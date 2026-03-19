// LMAITFU - Let Me AI That For You
// Client-side AI query animator with multiple backend support

(function() {
    'use strict';

    // Provider configurations
    const PROVIDERS = {
        huggingface: {
            name: 'Hugging Face',
            displayName: '🤗 Hugging Face',
            requiresKey: false,
            keyPrefix: 'hf_',
            // Using Mistral-7B-Instruct via HF Inference API
            model: 'mistralai/Mistral-7B-Instruct-v0.2'
        },
        openai: {
            name: 'ChatGPT',
            displayName: 'ChatGPT',
            requiresKey: true,
            keyPrefix: 'sk-',
            model: 'gpt-4o-mini'
        },
        anthropic: {
            name: 'Claude',
            displayName: 'Claude',
            requiresKey: true,
            keyPrefix: 'sk-ant-',
            model: 'claude-sonnet-4-20250514'
        }
    };

    // DOM Elements
    const setupMode = document.getElementById('setup-mode');
    const animationMode = document.getElementById('animation-mode');
    const providerSelectMode = document.getElementById('provider-select-mode');
    const keyEntryMode = document.getElementById('key-entry-mode');
    
    const apiProvider = document.getElementById('api-provider');
    const apiKey = document.getElementById('api-key');
    const apiKeyGroup = document.getElementById('api-key-group');
    const keyOptional = document.getElementById('key-optional');
    const keyHint = document.getElementById('key-hint');
    const questionInput = document.getElementById('question');
    const generateBtn = document.getElementById('generate-btn');
    const linkResult = document.getElementById('link-result');
    const generatedLink = document.getElementById('generated-link');
    const copyBtn = document.getElementById('copy-btn');
    
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const snarkMessage = document.getElementById('snark-message');
    
    const useFreeBtn = document.getElementById('use-free-btn');
    const useOwnKeyBtn = document.getElementById('use-own-key-btn');
    
    const viewerProvider = document.getElementById('viewer-provider');
    const viewerKey = document.getElementById('viewer-key');
    const viewerContinueBtn = document.getElementById('viewer-continue-btn');
    const backToFreeBtn = document.getElementById('back-to-free-btn');

    // Load saved settings
    const savedProvider = localStorage.getItem('lmaitfu_provider') || 'huggingface';
    const savedKey = localStorage.getItem('lmaitfu_key');
    apiProvider.value = savedProvider;
    if (savedKey) apiKey.value = savedKey;
    updateKeyUI();

    // Check if we're in view mode (URL has query)
    const urlParams = new URLSearchParams(window.location.search);
    const encodedQuery = urlParams.get('q');
    
    let currentQuery = '';

    if (encodedQuery) {
        startViewMode(encodedQuery);
    }

    // Event Listeners
    apiProvider.addEventListener('change', () => {
        localStorage.setItem('lmaitfu_provider', apiProvider.value);
        updateKeyUI();
    });
    
    apiKey.addEventListener('change', () => {
        localStorage.setItem('lmaitfu_key', apiKey.value);
    });

    generateBtn.addEventListener('click', generateLink);
    copyBtn.addEventListener('click', copyLink);
    
    useFreeBtn.addEventListener('click', () => {
        hideAllModes();
        playAnimation(currentQuery, 'huggingface', '');
    });
    
    useOwnKeyBtn.addEventListener('click', () => {
        hideAllModes();
        keyEntryMode.classList.remove('hidden');
    });
    
    backToFreeBtn.addEventListener('click', () => {
        hideAllModes();
        providerSelectMode.classList.remove('hidden');
    });
    
    viewerContinueBtn.addEventListener('click', () => {
        const key = viewerKey.value.trim();
        const provider = viewerProvider.value;
        if (key) {
            localStorage.setItem('lmaitfu_key', key);
            localStorage.setItem('lmaitfu_provider', provider);
            hideAllModes();
            playAnimation(currentQuery, provider, key);
        } else {
            alert('Please enter an API key');
        }
    });

    function updateKeyUI() {
        const provider = PROVIDERS[apiProvider.value];
        if (provider.requiresKey) {
            keyOptional.style.display = 'none';
            keyHint.textContent = 'Stored locally in your browser. Never sent anywhere except the AI provider.';
        } else {
            keyOptional.style.display = 'inline';
            keyHint.textContent = 'Hugging Face works without a key (rate-limited). Add one for higher limits.';
        }
    }

    function hideAllModes() {
        setupMode.classList.add('hidden');
        animationMode.classList.add('hidden');
        providerSelectMode.classList.add('hidden');
        keyEntryMode.classList.add('hidden');
    }

    function generateLink() {
        const question = questionInput.value.trim();
        const provider = apiProvider.value;
        
        if (!question) {
            alert('Please enter a question!');
            return;
        }
        
        // For providers that require a key, check it
        if (PROVIDERS[provider].requiresKey && !apiKey.value.trim()) {
            alert('This provider requires an API key!');
            return;
        }

        // Encode the question
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
        hideAllModes();
        
        try {
            currentQuery = decodeURIComponent(atob(encodedQuery));
        } catch (e) {
            currentQuery = 'What is the meaning of life?';
        }

        // Show provider selection
        providerSelectMode.classList.remove('hidden');
    }

    async function playAnimation(query, provider, key) {
        hideAllModes();
        animationMode.classList.remove('hidden');
        
        // Update header based on provider
        const providerConfig = PROVIDERS[provider];
        const providerName = document.querySelector('.provider-name');
        providerName.textContent = providerConfig.name;

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
            addMessage(`Error: ${error.message}`, 'assistant');
            
            // Still show snark, but modified
            await sleep(1000);
            snarkMessage.querySelector('p').textContent = 'Well, that didn\'t work. But you get the idea. 😅';
            snarkMessage.classList.remove('hidden');
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
            await sleep(30 + Math.random() * 40);
        }
    }

    async function callAI(query, provider, key) {
        switch (provider) {
            case 'huggingface':
                return callHuggingFace(query, key);
            case 'openai':
                return callOpenAI(query, key);
            case 'anthropic':
                return callAnthropic(query, key);
            default:
                throw new Error('Unknown provider');
        }
    }

    async function callHuggingFace(query, key) {
        const model = PROVIDERS.huggingface.model;
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add auth header if key provided
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }

        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                inputs: `<s>[INST] You are a helpful assistant. Give concise, direct answers. Keep responses under 200 words unless the question requires more detail.

${query} [/INST]`,
                parameters: {
                    max_new_tokens: 500,
                    temperature: 0.7,
                    return_full_text: false
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 503) {
                throw new Error('Model is loading, please try again in a few seconds');
            }
            throw new Error(error.error || 'Hugging Face API error');
        }

        const data = await response.json();
        
        // Handle array response
        if (Array.isArray(data)) {
            return data[0].generated_text.trim();
        }
        
        return data.generated_text?.trim() || 'No response generated';
    }

    async function callOpenAI(query, key) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: PROVIDERS.openai.model,
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
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: PROVIDERS.anthropic.model,
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
