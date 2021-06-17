(() => {
    const PROGRESS_BAR_WRAPPER_CLASS = "trello-progress-bar-wrapper";

    function diff(a, b) {
        let deleted = new Set(a);
        for (let elem of b) {
            deleted.delete(elem);
        }

        return deleted;
    }

    function debounce(f, ms) {
        let timeoutHandle = null;
        return () => {
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
            setTimeout(f, ms);
        };
    }

    function updateProgressBar(progressBarFillingElem, badge) {
        const [numerator, denominator] = badge.children[1].innerText.split("/");
        const percent = parseInt(numerator) / parseInt(denominator);
        progressBarFillingElem.style.width = `${Math.round(percent * 100)}%`;
    }

    let prevBadges = new Set();

    const parentNodesMap = {};

    function createBadge(badge, targetNode) {
        const progressBarWrapperElem = document.createElement("div");
        progressBarWrapperElem.classList.add("trello-progress-bar-wrapper");
        progressBarWrapperElem.style.width = "100%";
        progressBarWrapperElem.style.height = "1em";
        progressBarWrapperElem.style.backgroundColor = "#eee";
        progressBarWrapperElem.style.float = "left";
        progressBarWrapperElem.style.marginBottom = "0.25em";
        progressBarWrapperElem.style.borderRadius = "0.25em";
        targetNode.appendChild(progressBarWrapperElem);

        const progressBarFillingElem = document.createElement("div");
        progressBarFillingElem.style.backgroundColor = "hsl(110deg 45% 53%)";
        progressBarFillingElem.style.height = "100%";
        progressBarFillingElem.style.borderRadius = "0.25em";
        progressBarWrapperElem.appendChild(progressBarFillingElem);

        updateProgressBar(progressBarFillingElem, badge);
    }

    function updateBars() {
        let currBadges = new Set([
            ...Array.from(
                document.getElementsByClassName("js-checkitems-badge")
            ).filter((badge) => !badge.classList.contains("is-complete")),
        ]);

        const deletedBadges = diff(prevBadges, currBadges);

        deletedBadges.forEach((badge) => {
            const targetNode = parentNodesMap[badge];
            const wrapperElem = targetNode.getElementsByClassName(
                PROGRESS_BAR_WRAPPER_CLASS
            )[0];
            if (wrapperElem) {
                wrapperElem.remove();
            }
        });

        currBadges.forEach((badge) => {
            const targetNode = badge.parentNode.parentNode.parentNode;
            parentNodesMap[badge] = targetNode;
            const wrapperElem = targetNode.getElementsByClassName(
                PROGRESS_BAR_WRAPPER_CLASS
            )[0];
            if (wrapperElem) {
                const progressBarFillingElem = wrapperElem.children[0];
                updateProgressBar(progressBarFillingElem, badge);
            } else {
                createBadge(badge, targetNode);
            }
        });

        prevBadges = currBadges;
    }

    document.addEventListener("readystatechange", (event) => {
        if (event.target.readyState === "complete") {
            const debouncedUpdate = debounce(updateBars, 100);
            const observer = new MutationObserver((mutations) => {
                if (
                    mutations.some((m) => {
                        const relevantNodes = [
                            ...m.addedNodes,
                            ...m.removedNodes,
                        ];
                        return (
                            relevantNodes.some(
                                (n) =>
                                    !n.classList.contains(
                                        PROGRESS_BAR_WRAPPER_CLASS
                                    )
                            ) &&
                            !m.target.classList.contains(
                                PROGRESS_BAR_WRAPPER_CLASS
                            )
                        );
                    })
                ) {
                    debouncedUpdate();
                }
            });
            observer.observe(document.getElementById("board"), {
                childList: true,
                subtree: true,
            });
        }
    });
})();
