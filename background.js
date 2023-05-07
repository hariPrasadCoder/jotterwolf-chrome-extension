// 2023 Damian Janzi

//uncomment lines below when the default action when clicking extension icon is to open the sidebar. Please also delete the full line '"default_popup": "popup.html",' in manifest.json and make sure there is no empty line left
// chrome.action.onClicked.addListener(() => {
//     openIframeSidebar("https://charles-chrome-extension-demo.bubbleapps.io/popup", "400px");
// });

//uncomment lines below when the default action when clicking extension icon is to open the modal.Please also delete the full line '"default_popup": "popup.html",' in manifest.json and make sure there is no empty line left
// chrome.action.onClicked.addListener(() => {
//     openIframeModal("https://charles-chrome-extension-demo.bubbleapps.io/popup");
// });


// Define the available message handlers
const messageHandlers = {
    openIframeSidebar: (request) => openIframeSidebar(request.url, request.width),
    openIframeModal: (request) => openIframeModal(request.url),
};

// Message listener for handling messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Get the appropriate handler based on the request type
    const handler = messageHandlers[request.type];

    // Execute the handler if it exists
    if (handler) {
        handler(request);
    } else {
        console.log("Chrome Extension: unknown request type");
    }
});

// Define utility functions for injecting CSS and executing scripts
const functions = {
    // Function to inject CSS and execute a script in a specific tab
    injectCSSAndExecuteScript: (tabId, cssFiles, jsFiles, callback) => {
        // Insert the CSS files
        chrome.scripting.insertCSS({ target: { tabId }, files: cssFiles }, () => {
            // Execute the script files after CSS insertion is complete
            chrome.scripting.executeScript({ target: { tabId }, files: jsFiles }, callback);
        });
    },
};

// Function: open iframe in Sidebar
function openIframeSidebar(url, width) {
    chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
        functions.injectCSSAndExecuteScript(tab.id, ["files/modal.css"], ["files/modal.js"], () => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: openSidebar,
                args: [url, width],
            });
        });

        const msg = { type: "closePopup" };
        chrome.runtime.sendMessage(msg);
    });
}

// Function: open iframe in Modal
function openIframeModal(url) {
    chrome.tabs.query({ currentWindow: true, active: true }).then(([tab]) => {
        functions.injectCSSAndExecuteScript(tab.id, ["files/modal.css"], ["files/modal.js"], () => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: openModal,
                args: [url],
            });
        });

        const msg = { type: "closePopup" };
        chrome.runtime.sendMessage(msg);
    });
}

//open Sidebar: injection function
function openSidebar(url, width) {
    //create sidebar elements
    var chrlsSidebarModal = document.createElement("div");
    chrlsSidebarModal.id = "chrls-sidebar-modal";
    chrlsSidebarModal.style.width = width;
    chrlsSidebarModal.style.right = "-" + width;

    var chrlsSidebarCloseButton = document.createElement("div");
    chrlsSidebarCloseButton.id = "chrls-sidebar-close-button";

    var chrlsCloseButtonSpan = document.createElement("span");
    chrlsCloseButtonSpan.innerHTML = "✕";

    var chrlsSidebarContent = document.createElement("iframe");
    chrlsSidebarContent.id = "chrls-iframe";
    chrlsSidebarContent.src = url;

    chrlsSidebarCloseButton.appendChild(chrlsCloseButtonSpan);
    chrlsSidebarModal.appendChild(chrlsSidebarCloseButton);
    chrlsSidebarModal.appendChild(chrlsSidebarContent);

    //add sidebar to DOM and use animation to show it
    // Check if sidebar is already in the DOM
    var existingSidebar = document.getElementById("chrls-sidebar-modal");
    if (!existingSidebar) {
        document.body.appendChild(chrlsSidebarModal);
    }
    var chrlsSidebarModal = document.getElementById("chrls-sidebar-modal");
    var chrlsSidebarCloseButton = document.getElementById("chrls-sidebar-close-button");

    setTimeout(function () {
        chrlsSidebarModal.style.transform = "translateX(-" + chrlsSidebarModal.clientWidth + "px)";
        chrlsSidebarCloseButton.style.transform = "translateX(" + (chrlsSidebarModal.clientWidth - 50) + "px)";
        chrlsSidebarCloseButton.style.visibility = "visible";
    }
        , 200);

    //close sidebar function    
    function chrlsCloseSidebar() {
        chrlsSidebarModal.style.transition = "transform 0.8s ease";
        chrlsSidebarModal.style.transform = "translateX(" + chrlsSidebarModal.clientWidth + "px)";;
        //remove sidebar after animation
        // setTimeout(function () {
        //     chrlsSidebarModal.remove();
        // }
        //     , 800);
    }

    chrlsSidebarCloseButton.addEventListener("click", chrlsCloseSidebar);
};



//open Modal: injection function
function openModal(url) {
    //create modal
    document.body.style.overflow = "hidden";

    var chrlsFullModal = document.createElement("div");
    chrlsFullModal.id = "chrls-full-modal";
    chrlsFullModal.style.top = "100%";

    var chrlsFullCloseButton = document.createElement("div");
    chrlsFullCloseButton.id = "chrls-full-close-button";

    var chrlsCloseButtonSpan = document.createElement("span");
    chrlsCloseButtonSpan.innerHTML = "✕";

    var chrlsFullContent = document.createElement("iframe");
    chrlsFullContent.id = "chrls-iframe";
    chrlsFullContent.src = url;

    chrlsFullCloseButton.appendChild(chrlsCloseButtonSpan);
    chrlsFullModal.appendChild(chrlsFullCloseButton);
    chrlsFullModal.appendChild(chrlsFullContent);

    //add full to DOM and use animation to show it
    var existingFullModal = document.getElementById("chrls-full-modal");
    if (!existingFullModal) {
        document.body.appendChild(chrlsFullModal);
    }

    var chrlsFullModal = document.getElementById("chrls-full-modal");
    var chrlsFullCloseButton = document.getElementById("chrls-full-close-button");

    setTimeout(function () {
        chrlsFullModal.style.transform = "translateY(-100%)";
        chrlsFullCloseButton.style.transform = "translateY(10px)";
        chrlsFullCloseButton.style.visibility = "visible";
    }
        , 200);

    function chrlsCloseFull() {
        chrlsFullModal.style.transition = "transform 0.8s ease";
        chrlsFullModal.style.transform = "translateY(100%)";
        //remove full after animation
        // setTimeout(function () {
        //     chrlsFullModal.remove();
        //     document.body.style.overflow = bodyScroll;
        // }
        //     , 800);
    }

    chrlsFullCloseButton.addEventListener("click", chrlsCloseFull);
};

