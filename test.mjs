import cv from 'opencv4nodejs'

const drawRect = (image, rect, color, opts = { thickness: 2 }) =>
  image.drawRectangle(
    rect,
    color,
    opts.thickness,
    cv.LINE_8
  );
const drawBlueRect = (image, rect, opts = { thickness: 2 }) => drawRect(image, rect, new cv.Vec(255, 0, 0), opts);
const image = cv.imread('./test/jpg_1.jpg');
const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

// detect faces
const { objects, numDetections } = classifier.detectMultiScale(image.bgrToGray());
console.log('faceRects:', objects);
console.log('confidences:', numDetections);

if (!objects.length) {
  throw new Error('No faces detected!');
}

// draw detection
const numDetectionsTh = 10;
objects.forEach((rect, i) => {
  const thickness = numDetections[i] < numDetectionsTh ? 1 : 2;
  drawBlueRect(image, rect, { thickness });
});

cv.imshowWait('face detection', image);