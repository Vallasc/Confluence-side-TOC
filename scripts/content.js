const headingPaddingTop = 100;

// Create div for TOC (Table of Contents)
const tocContainer = document.createElement("div");
tocContainer.id = "toc-container";
let isMouseOverToc = false;

tocContainer.addEventListener("mouseover", () => {
  isMouseOverToc = true;
});

tocContainer.addEventListener("mouseout", () => {
  isMouseOverToc = false;
});

let contentElement;
let headings = [];
let lastVisibleHeading;
let scrollTimer;
let scrollListener;

// Add styles
const style = document.createElement("style");
style.textContent = `
  #toc-container {
    width: min(19vw, 450px);
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

// Fills TOC container
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
    // Create an element of the list for each hading
    const listItem = document.createElement("li");
    listItem.style.marginLeft = `${
      (parseInt(heading.tagName.charAt(1)) - 1) * 20
    }px`;
    if (heading.tagName === "h1") {
      listItem.style.marginTop = "16px";
    }
    listItem.style.marginBottom = "8px";

    // Create a link fore ach heading
    const link = document.createElement("a");
    link.href = `#${heading.hId}`;
    link.textContent = heading.textContent;
    // Apply a custom style for h1
    if (heading.tagName.toLowerCase() === "h1") {
      link.classList.add("h1");
    } else {
      // Add a dot for other elements
      link.classList.add("hOther");
      const bullet = document.createElement("span");
      bullet.textContent = "•";
      bullet.style.marginRight = "8px";
      link.prepend(bullet);
    }

    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });

  tocContainer.innerHTML = ""; // Remove old content
  tocContainer.appendChild(tocList);
};

// Get first visible heading in document
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

// Highlight link on side menu
const highlightMenuHeading = (heading) => {
  if (heading) {
    if (lastVisibleHeading) {
      const oldLink = tocContainer.querySelector(
        `a[href="#${lastVisibleHeading.hId}"]`
      );
      if (oldLink) {
        oldLink.classList.remove("active");
      }
    }
    lastVisibleHeading = heading;
    const link = tocContainer.querySelector(`a[href="#${heading.hId}"]`);
    if (link) {
      link.classList.add("active");
    }
  }
};

// Scrolls on the selected link
const scrollIntoMenuHeading = (heading) => {
  if (heading) {
    const link = tocContainer.querySelector(`a[href="#${heading.hId}"]`);
    if (link) {
      const linkPosition = link.offsetTop;
      const containerScrollTop = tocContainer.scrollTop;
      const containerHeight = tocContainer.clientHeight;
      const linkHeight = link.clientHeight;

      // Check if link is active and visible in TOC container
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
  const handleOnScroll = () => {
    if (scrollTimer) {
      window.clearTimeout(scrollTimer);
    }
    scrollTimer = setTimeout(() => {
      let visibleHeading = getVisibleHeading();
      highlightMenuHeading(visibleHeading);
      scrollIntoMenuHeading(visibleHeading);
    }, 200);
  };
  window.addEventListener("scroll", handleOnScroll);
};

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

const init = () => {
  console.log("Loading Side TOC");
  const mainElement = document.querySelector("main");
  contentElement = document.querySelector("#content");
  if (!contentElement) {
    contentElement = mainElement;
  }
  if (mainElement && !document.body.contains(tocContainer)) {
    mainElement.parentNode.insertBefore(tocContainer, mainElement);
  }
  observer.disconnect();
  observer.observe(mainElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  generateTOC();
};

const locationChecker = () => {
  const isPages = location.href.split("/")[6] === 'pages';
  return location.href.includes("/wiki/spaces/") && isPages;
};

if (locationChecker()) {
  init();
  highlightVisibleMenuHeading();
}

let oldLocation = location.href;
let oldSpace = location.href.split("/")[5];
setInterval(() => {
  const currentSpace = location.href.split("/")[5];
  console.log(currentSpace)
  console.log(oldSpace)
  if (
    locationChecker() &&
    location.href !== oldLocation &&
    (currentSpace !== oldSpace ||
      oldLocation.includes("/edit-v2/") !== location.href.includes("/edit-v2/"))
  ) {
    console.log("Reload TOC")
    setTimeout(() => {
      init();
    }, 2000);
  }
  oldLocation = location.href;
  oldSpace = currentSpace;
}, 2000); // check every two second
