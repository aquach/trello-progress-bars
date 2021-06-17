(() => {
    function venn(setA, setB) {
        let a = new Set(setA);
        let ab = new Set();
        let b = new Set(setB);
        for (let elem of setB) {
            a.delete(elem);
            if (setA.has(elem)) {
                ab.add(elem);
            }
        }
        for (let elem of setA) {
            b.delete(elem);
        }
        return { a, b, ab };
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

        const { a: deletedBadges, b: newBadges, ab: existingBadges } = venn(
            prevBadges,
            currBadges
        );

        // console.log(
        //     `Before: ${prevBadges.size} badges. Now: ${currBadges.size} badges. ${deletedBadges.size} deleted, ${newBadges.size} created, ${existingBadges.size} still extant.`
        // );

        deletedBadges.forEach((badge) => {
            const targetNode = parentNodesMap[badge];
            const wrapperElem = targetNode.getElementsByClassName(
                "trello-progress-bar-wrapper"
            )[0];
            if (wrapperElem) {
                wrapperElem.remove();
            }
        });

        existingBadges.forEach((badge) => {
            const targetNode = badge.parentNode.parentNode.parentNode;
            const wrapperElem = targetNode.getElementsByClassName(
                "trello-progress-bar-wrapper"
            )[0];
            if (wrapperElem) {
                const progressBarFillingElem = wrapperElem.children[0];
                updateProgressBar(progressBarFillingElem, badge);
            } else {
                createBadge(badge, targetNode);
            }
        });

        newBadges.forEach((badge) => {
            const targetNode = badge.parentNode.parentNode.parentNode;
            parentNodesMap[badge] = targetNode;

            // console.log(
            //     `Creating progress bar for node ${targetNode.innerText}.`
            // );
            createBadge(badge, targetNode);
        });

        prevBadges = currBadges;
    }

    const observer = new MutationObserver(debounce(updateBars, 100));
    observer.observe(document.getElementById("board"), {
        childList: true,
        subtree: true,
    });
})();
