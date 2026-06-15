const RENAME = {
    "ERPNext": "Ellieclinic",
    "Marley Health": "HealthLink",
    "Frappe HR": "Ellieclinic HR",
};

function rebrand(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        const text = node.nodeValue.trim();
        if (RENAME[text]) {
            node.nodeValue = node.nodeValue.replace(text, RENAME[text]);
        }
    }
}
const observer = new MutationObserver(() => rebrand(document.body));
observer.observe(document.body, { childList: true, subtree: true });
rebrand(document.body);