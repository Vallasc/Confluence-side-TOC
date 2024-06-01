// Crea il contenitore del TOC (Table of Contents)
const tocContainer = document.createElement("div");
tocContainer.id = "toc-container";

// Aggiungi stili per la scrollbar e per il link hover
const style = document.createElement("style");
style.textContent = `
  #toc-container {
    width: 450px;
    position: sticky;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    top: 120px;
    padding-left: 24px;
    border-right: 1px solid #ccc;
  }

  #toc-container::-webkit-scrollbar {
    width: 5px;
  }
  #toc-container::-webkit-scrollbar-track {
    background: #00000000;
  }
  #toc-container::-webkit-scrollbar-thumb {
    background: #f1f1f1;
    border-radius: 0px;
  }
  #toc-container::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  #toc-container a:hover {
    text-decoration: underline !important;
  }
  #toc-container a {
    text-decoration: none;
  }
  #toc-container a.active {
    color: var(--ds-link) !important;
  }
  #toc-container a.h1 {
    font-weight: bold;
    color: var(--ds-text);
  }
  #toc-container a.hOther {
    display: inline-flex;
    alignItems: center;
    color: var(--ds-text-subtle);
  }
`;

document.head.appendChild(style);

let headings = [];

const generateId = (heading, idMap) => {
  let baseId = encodeURIComponent(
    heading.textContent.trim().replaceAll(" ", "-")
  );
  let id = baseId;
  let counter = 1;
  while (idMap[id]) {
    id = `${baseId}.${counter}`;
    counter++;
  }
  idMap[id] = true;
  return id;
};

// Funzione per creare il TOC
const generateTOC = () => {
  let idMap = {};
  headings = contentElement.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headings.forEach((heading) => {
    if (!heading.hId) {
      heading.hId = generateId(heading, idMap);
    }
  });

  const tocList = document.createElement("ul");
  tocList.style.listStyleType = "none";
  tocList.style.paddingLeft = "0";

  headings.forEach((heading, index) => {
    // Crea un elemento della lista per ogni heading
    const listItem = document.createElement("li");
    listItem.style.marginLeft = `${
      (parseInt(heading.tagName.charAt(1)) - 1) * 20
    }px`;
    if (heading.tagName === "h1") {
      listItem.style.marginTop = "16px";
    }
    listItem.style.marginBottom = "8px";

    // Crea un link per ogni heading
    const link = document.createElement("a");
    link.href = `#${heading.hId}`;
    link.textContent = heading.textContent;
    // Applica lo stile specifico per gli h1
    if (heading.tagName.toLowerCase() === "h1") {
      link.classList.add("h1");
    } else {
      // Aggiungi un pallino all'inizio per gli altri heading
      link.classList.add("hOther");
      const bullet = document.createElement("span");
      bullet.textContent = "•";
      bullet.style.marginRight = "8px";
      link.prepend(bullet);
    }

    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });

  tocContainer.innerHTML = ""; // Cancella il contenuto precedente
  tocContainer.appendChild(tocList);
};

const headingPaddingTop = 100;
let lastVisibleHeading;

// Funzione per evidenziare il titolo attualmente visibile
const getVisibleHeading = () => {
  let firstVisibleHeading = headings[0];

  for (let heading of headings) {
    const rect = heading.getBoundingClientRect();
    if (rect.top < headingPaddingTop) {
      firstVisibleHeading = heading;
    } else if (
      rect.top >= headingPaddingTop &&
      rect.bottom <= window.innerHeight
    ) {
      firstVisibleHeading = heading;
      break;
    } else {
      break;
    }
  }
  return firstVisibleHeading;
};

const highlightMenuHeading = (heading) => {
  if (heading) {
    if (lastVisibleHeading) {
      tocContainer
        .querySelector(`a[href="#${lastVisibleHeading.hId}"]`)
        .classList.remove("active");
    }
    lastVisibleHeading = heading;
    const link = tocContainer.querySelector(`a[href="#${heading.hId}"]`);
    if (link) {
      link.classList.add("active");
    }
  }
};

const scrollIntoMenuHeading = (heading) => {
  if (heading) {
    const link = tocContainer.querySelector(`a[href="#${heading.hId}"]`);
    if (link) {
      const linkPosition = link.offsetTop;
      const containerScrollTop = tocContainer.scrollTop;
      const containerHeight = tocContainer.clientHeight;
      const linkHeight = link.clientHeight;

      // Controlla se il link attivo è visibile nel contenitore del TOC
      if (
        (linkPosition < containerScrollTop ||
          linkPosition + linkHeight > containerScrollTop + containerHeight) &&
        !isMouseOverToc
      ) {
        tocContainer.scrollTop =
          linkPosition - containerHeight / 2 + linkHeight / 2;
      }
    }
  }
};

const highlightVisibleMenuHeading = () => {
  let timer;
  window.addEventListener("scroll", () => {
    if (timer) {
      window.clearTimeout(timer);
    }
    timer = setTimeout(() => {
      let visibleHeading = getVisibleHeading();
      highlightMenuHeading(visibleHeading);
      scrollIntoMenuHeading(visibleHeading);
    }, 200);
  });
};

let isMouseOverToc = false;

tocContainer.addEventListener("mouseover", () => {
  isMouseOverToc = true;
});

tocContainer.addEventListener("mouseout", () => {
  isMouseOverToc = false;
});

// Listen to headers changes
const observer = new MutationObserver((mutations) => {
  const headingTags = ["H1", "H2", "H3", "H4", "H5", "H6"];
  let shouldUpdateTOC = false;

  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node && headingTags.includes(node.nodeName)) {
          shouldUpdateTOC = true;
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node && headingTags.includes(node.nodeName)) {
          shouldUpdateTOC = true;
        }
      });
    } else if (mutation.type === "characterData") {
      if (headingTags.includes(mutation.target.parentNode.nodeName)) {
        shouldUpdateTOC = true;
      }
    }
  });

  if (shouldUpdateTOC) {
    generateTOC();
  }
});

// Trova il tag main e inserisci il TOC come suo fratello
const mainElement = document.querySelector("main");
let contentElement = document.querySelector("#content");
if (!contentElement) {
  contentElement = mainElement;
}
if (mainElement) {
  mainElement.parentNode.insertBefore(tocContainer, mainElement);
}

const init = () => {
  observer.disconnect();
  observer.observe(mainElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  generateTOC();
  highlightVisibleMenuHeading();
};

init();

var oldLocation = location.href;
setInterval(() => {
  if (location.href != oldLocation) {
    oldLocation = location.href;
    if(location.href.includes('/edit-v2/')) {
      setTimeout(() => {
        init();
      }, 1000);
    }
    console.log("address changed");
  }
}, 1000); // check every second
