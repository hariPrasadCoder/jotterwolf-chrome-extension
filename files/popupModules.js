// 2023 Damian Janzi
'use strict';

//load popup iframe
window.onload = load_iframe();

function load_iframe() {
    var iframe = document.createElement('iframe');
    iframe.id = "ExtensioniFrame";
    iframe.src = appURL;
    iframe.style.overflow = "hidden";
    iframe.style.cssText = 'width:100%;height:100%;';
    document.body.appendChild(iframe);
}


//*************************************************************************************************/
// Function to post a message to the iframe
function postMessageToPlugin(msg) {
    const iframe = document.getElementById("ExtensioniFrame");
    const iframeWindow = (iframe.contentWindow || iframe.contentDocument);
    iframeWindow.postMessage(JSON.stringify(msg), "*");
}

// Event listener function to handle messages from the bubble plugin
function handleMessage(event) {
    // Check if the event origin matches the allowed origin
    if (event.origin !== "https://" + appURL.hostname) {
        console.log("Chrome Extension: postMessage's targetOrigin not allowed, STOP.");
        return;
    }

    // Ignore the event if no data is present
    if (!event.data) {
        return;
    }

    // Parse the received message
    const reqMessage = JSON.parse(event.data);

    // Define the available message actions
    const messageActions = {
        tabInfo: () => returnTabInfo(),
        selectedText: () => returnSelectedText(),
        elementText: () => getElementText(reqMessage.selector),
        elementHTML: () => getElementHTML(reqMessage.selector),
        showAlert: () => showAlert(reqMessage.alertText),
        openNewTab: () => openNewTab(reqMessage.url),
        openIframeModal: () => openIframeModal(reqMessage.url),
        openIframeSidebar: () => openIframeSidebar(reqMessage.url, reqMessage.width),
        closePopup: () => window.close(),
        copyToClipboard: () => copyToClipboard(reqMessage.text),
        injectJS: () => injectJS(reqMessage.filename),
        writeToLocalStorage: () => reqMessage.context === "extension" ?
            writeToLocalStorage(reqMessage.key, reqMessage.value) :
            writeToLocalStorageInTab(reqMessage.key, reqMessage.value),
        readFromLocalStorage: () => reqMessage.context === "extension" ?
            readFromLocalStorage(reqMessage.key) :
            readFromLocalStorageInTab(reqMessage.key),
        deleteFromLocalStorage: () => reqMessage.context === "extension" ?
            deleteFromLocalStorage(reqMessage.key) :
            deleteFromLocalStorageInTab(reqMessage.key),
        clearLocalStorage: () => reqMessage.context === "extension" ?
            clearLocalStorage() :
            clearLocalStorageInTab(),
        setBadgeTextAndColor: () => setBadgeTextAndColor(reqMessage.text, reqMessage.color),
        setIcon: () => setIcon(reqMessage.path),
        fillInput: () => populateInputField(reqMessage.selector, reqMessage.value),
    };

    // Execute the requested action if it exists in the messageActions object
    if (messageActions.hasOwnProperty(reqMessage.requestType)) {
        messageActions[reqMessage.requestType]();
    }
}

// Function to handle messages from background.js
function handleChromeMessage(request, sender, sendResponse) {
    // Define the available actions for handling Chrome messages
    const chromeMessageActions = {
        closePopup: () => window.close(),
    };

    // Execute the requested action if it exists in the chromeMessageActions object
    if (chromeMessageActions.hasOwnProperty(request.type)) {
        chromeMessageActions[request.type]();
    } else {
        console.log("Chrome Extension: unknown request type");
    }
}

// Add event listeners to listen for messages from the iframe and background.js
window.addEventListener('message', handleMessage, false);
chrome.runtime.onMessage.addListener(handleChromeMessage);


//*************************************************************************************************/
//*************************************************************************************************/
//functions to be called from above

// Helper function to send message
function sendMessageToBackground(msg) {
    chrome.runtime.sendMessage(msg);
}

// Helper function to query the current active tab
function queryActiveTab(callback) {
    chrome.tabs.query({ currentWindow: true, active: true }, callback);
}

// Helper function to execute a script in the current active tab
function executeScriptInActiveTab(func, args, callback) {
    queryActiveTab(([tab]) => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: func,
            args: args,
        }, callback);
    });
}

// Function: open iframe in Modal
function openIframeModal(url) {
    sendMessageToBackground({ type: "openIframeModal", url: url });
}

// Function: open iframe in Sidebar
function openIframeSidebar(url, width) {
    sendMessageToBackground({ type: "openIframeSidebar", url: url, width: width });
}

// Function: inject custom javascript file
function injectJS(filename) {
    queryActiveTab(([tab]) => {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["CustomJavaScript/" + filename]
        }, () => {
            console.log("injected javascript");
        });
    });
}

// Function: return tab info
function returnTabInfo() {
    queryActiveTab((tabs) => {
        var msg = { returnType: "tabInfo", url: tabs[0].url, title: tabs[0].title };
        postMessageToPlugin(msg);
    });
}

// Function: return selected text
function returnSelectedText() {
    executeScriptInActiveTab(getSelection, null, (selection) => {
        if (selection) {
            var msg = { returnType: "textSelection", text: selection[0].result };
            postMessageToPlugin(msg);
        }
    });
}

// Function: get selected text (injection function)
function getSelection() {
    return window.getSelection().toString();
}

// Function: show alert
function showAlert(txt) {
    executeScriptInActiveTab(displayAlert, [txt]);
}

// Function: show alert (injection function)
function displayAlert(txt) {
    alert(txt);
}

// Function: open a new tab
function openNewTab(newURL) {
    var url = newURL.startsWith("//s3") ? "https:" + newURL : newURL;
    url = url.startsWith("https://") ? url : "https://" + url;
    chrome.tabs.create({ url: url });
}

// Function: copy to clipboard
function copyToClipboard(txt) {
    executeScriptInActiveTab(copyToTheClipboard, [txt]);
}

// Function: copy to clipboard (injection function)
async function copyToTheClipboard(textToCopy) {
    const el = document.createElement('textarea');
    el.value = textToCopy;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

// Function: get the text of an element from the DOM of current tab
function getElementText(selector) {
    executeScriptInActiveTab(getElementTextFromDOM, [selector], (result) => {
        if (result) {
            var msg = { returnType: "getElementText", selector: selector, text: result[0].result };
            postMessageToPlugin(msg);
        }
    });
}

// Function: get element text (injection function)
function getElementTextFromDOM(selector) {
    var element = document.querySelector(selector);
    return element ? element.innerText : "";
}

// Function: get the HTML of an element from the DOM of current tab
function getElementHTML(selector) {
    executeScriptInActiveTab(getElementHTMLFromDOM, [selector], (result) => {
        if (result) {
            var msg = { returnType: "getElementHTML", selector: selector, HTML: result[0].result };
            postMessageToPlugin(msg);
        }
    });
}

// Function: get element HTML (injection function)
function getElementHTMLFromDOM(selector) {
    var element = document.querySelector(selector);
    return element ? element.outerHTML : "";
}

// Function: set badge text and color
function setBadgeTextAndColor(text, color) {
    chrome.action.setBadgeText({ text: text || "" });
    chrome.action.setBadgeBackgroundColor({ color: color });
}

// Function: set icon
function setIcon(path) {
    chrome.action.setIcon({ path: path });
}

// Function: fill value into input field
function populateInputField(selector, value) {
    executeScriptInActiveTab(populateInputFieldInDOM, [selector, value]);
}

// Function: populate input field (injection function)
function populateInputFieldInDOM(selector, value) {
    var element = document.querySelector(selector);
    if (!element) return console.log("Chrome Extension: no element found for selector: " + selector);

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = value;
    } else {
        element.innerText = value;
    }
}

//*************************************************************************************************/
//Chrome storage functions in extension context
//write to chrome window.localStorage in extension context
function writeToLocalStorage(key, value) {
    window.localStorage.setItem(key, value);
}
;
//read from chrome local storage
function readFromLocalStorage(key) {
    var result = window.localStorage.getItem(key);
    var msg = { returnType: "localVariable", key: key, value: result };
    postMessageToPlugin(msg);
}
;
//delete from chrome local storage
function deleteFromLocalStorage(key) {
    window.localStorage.removeItem(key);
}
;
//clear chrome local storage
function clearLocalStorage() {
    window.localStorage.clear();
}
//*************************************************************************************************/
//Chrome storage functions in active tab context
//write to chrome window.localStorage in active tab context
// Function: write to local storage in tab context
function writeToLocalStorageInTab(key, value) {
    console.log("writing to local storage in tab context");
    executeScriptInActiveTab(writeToLocalStorageInTabContext, [key, value]);
}

// Function: write to local storage in tab context (injection function)
function writeToLocalStorageInTabContext(key, value) {
    window.localStorage.setItem(key, value);
}

// Function: read from local storage in tab context
function readFromLocalStorageInTab(key) {
    executeScriptInActiveTab(readFromLocalStorageInTabContext, [key], (result) => {
        if (result) {
            var msg = { returnType: "localVariable", key: key, value: result[0].result };
            postMessageToPlugin(msg);
        }
    });
}

// Function: read from local storage in tab context (injection function)
function readFromLocalStorageInTabContext(key) {
    return window.localStorage.getItem(key).toString();
}

// Function: delete from local storage in tab context
function deleteFromLocalStorageInTab(key) {
    executeScriptInActiveTab(deleteFromLocalStorageInTabContext, [key]);
}

// Function: delete from local storage in tab context (injection function)
function deleteFromLocalStorageInTabContext(key) {
    window.localStorage.removeItem(key);
}

// Function: clear local storage in tab context
function clearLocalStorageInTab() {
    executeScriptInActiveTab(clearLocalStorageInTabContext);
}

// Function: clear local storage in tab context (injection function)
function clearLocalStorageInTabContext() {
    window.localStorage.clear();
}
