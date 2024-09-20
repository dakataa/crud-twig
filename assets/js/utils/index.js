/**
 * --------------------------------------------------------------------------
 * Public Util Api
 * --------------------------------------------------------------------------
 */

const isElementVisible = (element, context) => {
    return !!(element.offsetWidth || element.offsetHeight || (typeof element.getClientRects === 'function' && element.getClientRects().length));
}


const isElementInViewPort = (element, context, contains, axisX, axisY) => {
    const offsetTop = element => {
        return Math.ceil(element.getBoundingClientRect().top);
    }

    const offsetLeft = element => {
        return Math.ceil(element.getBoundingClientRect().left);
    }

    contains = contains || false;
    axisX = axisX === undefined ? true : axisX;
    axisY = axisY === undefined ? true : axisY;

    let contextWidth = (context ? context.clientWidth : (window.innerWidth || document.documentElement.clientWidth)),
        contextHeight = (context ? context.clientHeight : (window.innerHeight || document.documentElement.clientHeight));

    let elementLeft = (offsetLeft(element) || 0) - (context ? offsetLeft(context) : 0),
        elementWidth = (element.clientWidth || 0),
        elementRight = elementLeft + elementWidth;

    let elementTop = (offsetTop(element) || 0) - (context ? offsetTop(context) : 0),
        elementHeight = (element.clientHeight || 0),
        elementBottom = elementTop + elementHeight;

    if (contains) {
        return (!axisX || (axisX && elementLeft >= 0 && elementRight <= contextWidth))
            && (!axisY || (axisY && elementTop >= 0 && elementBottom <= contextHeight));
    }


    return !((((elementRight <= 0) || (elementLeft >= contextWidth)) && axisX))
        && !((((elementBottom <= 0) || (elementTop >= contextHeight)) && axisY))
        ;
}

const checkElementVisibility = element => {
    return new Promise((resolve, reject) => {
        const isOk = element => {
            if (isElementVisible(element) && isElementInViewPort(element, null, false, true, true)) {
                resolve();
                return;
            }

            setTimeout(() => isOk(element), 100);
        }

        isOk(element);
    });
};

export {
    isElementVisible,
    isElementInViewPort,
    checkElementVisibility,
}