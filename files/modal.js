// 2023 Damian Janzi

//event listeners, , making sure origin is the iframe url
// Function to handle messages received from the iframe
function handleMessage(event) {
    const chrlsIFrame = document.getElementById("chrls-iframe");
    const iframeUrl = chrlsIFrame.src;

    // Check if the origin of the event matches the iframe's URL
    if (iframeUrl.indexOf(event.origin) === -1) {
        console.log("Chrome Extension: postMessage's targetOrigin not allowed, STOP.");
        console.log("Chrome Extension: event.origin: " + event.origin);
        console.log("Chrome Extension: url: " + iframeUrl);
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
        copyToClipboard: () => copyToClipboard(reqMessage.text),
        tabInfo: () => returnTabInfo(),
        elementText: () => getElementText(reqMessage.selector),
        elementHTML: () => getElementHTML(reqMessage.selector),
        showAlert: () => showAlert(reqMessage.alertText),
        openNewTab: () => openNewTab(reqMessage.url),
        writeToLocalStorage: () => writeToLocalStorage(reqMessage.key, reqMessage.value),
        readFromLocalStorage: () => readFromLocalStorage(reqMessage.key),
        deleteFromLocalStorage: () => deleteFromLocalStorage(reqMessage.key),
        clearLocalStorage: () => clearLocalStorage(),
        fillInput: () => populateInputField(reqMessage.selector, reqMessage.value),
    };

    // Execute the requested action if it exists in the messageActions object
    if (messageActions.hasOwnProperty(reqMessage.requestType)) {
        messageActions[reqMessage.requestType]();
    }
}

// Add an event listener to listen for messages from the iframe
window.addEventListener('message', handleMessage, false);



//post message to popup iframe (to be used in functions below)
function postMessageToPlugin(msg) {
    var msg = JSON.stringify(msg);
    //get extension iframe
    var chrlsIFrame = document.getElementById("chrls-iframe");
    chrlsIFrame.contentWindow.postMessage(msg, "*");
}

//function: copy text to clipboard
function copyToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
}

//function: get infos about current tab and post to iframe
function returnTabInfo() {
    var msg = {
        "returnType": "tabInfo",
        "url": window.location.href,
        "title": document.title
    };
    postMessageToPlugin(msg);

    //on click or URL change, post new url to iframe
    function handleEvent(event) {
        var msg = {
            "returnType": "tabInfo",
            "url": window.location.href,
            "title": document.title
        };
        postMessageToPlugin(msg);
    }
    // Attach the event listeners
    window.addEventListener('popstate', handleEvent);
    window.addEventListener('click', handleEvent);

}

//function: post selected text to iframe on selection
document.addEventListener('selectionchange', function () {
    var selectedText = window.getSelection().toString();
    var msg = {
        "returnType": "textSelection",
        "text": selectedText
    };
    postMessageToPlugin(msg);
});

//function: get element text and post to iframe
function getElementText(selector) {
    var element = document.querySelector(selector);
    if (!element) return console.log("Chrome Extension: no element found for selector: " + selector);
    var elementText = element.innerText;
    var msg = {
        "returnType": "getElementText",
        "selector": selector,
        "text": elementText
    };
    postMessageToPlugin(msg);

    //on click or URL change, post new text to iframe
    function handleEvent(event) {
        var element = document.querySelector(selector);
        if (!element) return console.log("Chrome Extension: no element found for selector: " + selector);
        var elementText = element.innerText;
        var msg = {
            "returnType": "getElementText",
            "selector": selector,
            "text": elementText
        };
        postMessageToPlugin(msg);
    }
    // Attach the event listeners
    window.addEventListener('popstate', handleEvent);
    window.addEventListener('click', handleEvent);
}

//function: get element HTML and post to iframe
function getElementHTML(selector) {
    var element = document.querySelector(selector);
    if (!element) return console.log("Chrome Extension: no element found for selector: " + selector);
    var elementHTML = element.outerHTML;
    var msg = {
        "returnType": "getElementHTML",
        "selector": selector,
        "HTML": elementHTML
    };
    postMessageToPlugin(msg);

    //on click or URL change, post new HTML to iframe
    function handleEvent2(event) {
        var element = document.querySelector(selector);
        if (!element) return console.log("Chrome Extension: no element found for selector: " + selector);
        var elementHTML = element.outerHTML;
        var msg = {
            "returnType": "getElementHTML",
            "selector": selector,
            "HTML": elementHTML
        };
        postMessageToPlugin(msg);
    }
    // Attach the event listeners
    window.addEventListener('popstate', handleEvent2);
    window.addEventListener('click', handleEvent2);
}



//function: show alert
function showAlert(alertText) {
    alert(alertText);
}

//function: open new tab
function openNewTab(newURL) {
    var myUrl = newURL;
    if (myUrl.substring(0, 4) == "//s3") {
        myUrl = "https:" + myUrl;
    }
    if (myUrl.substring(0, 8) != "https://") {
        myUrl = "https://" + myUrl;
    }
    window.open(myUrl, '_blank');
}


//function: fill input field
function populateInputField(selector, value) {
    var element = document.querySelector(selector);
    if (!element) return console.log("Chrome Extension: no element found for selector: " + selector);
    if (element.tagName === 'INPUT') {
        element.value = value;
    } else {
        element.innerText = value;
    }
}

//Chrome storage functions in extension context

//write to chrome window.localStorage in extension context
function writeToLocalStorage(key, value) {
    window.localStorage.setItem(key, value)
};

//read from chrome local storage
function readFromLocalStorage(key) {
    var result = window.localStorage.getItem(key);
    var msg = {
        "returnType": "localVariable",
        "key": key,
        "value": result
    };
    postMessageToPlugin(msg);
};

//delete from chrome local storage
function deleteFromLocalStorage(key) {
    window.localStorage.removeItem(key);
};

//clear chrome local storage
function clearLocalStorage() {
    window.localStorage.clear();
}

console.log("Chrome Extension: modal.js loaded");