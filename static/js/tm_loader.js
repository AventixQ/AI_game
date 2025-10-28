let model, webcam, maxPredictions;
let handProb = 0.0;
const THRESHOLD = 0.97;
let canJump = true;
const JUMP_COOLDOWN_MS = 400;

async function initTeachableMachine() {
  model = await tmImage.load(MODEL_JSON, METADATA_JSON);
  maxPredictions = model.getTotalClasses();

  const flip = true;
  webcam = new tmImage.Webcam(200, 150, flip);
  await webcam.setup();
  await webcam.play();

  const webcamCanvas = document.getElementById("webcam-canvas");
  const ctx = webcamCanvas.getContext("2d");

  async function loop() {
    webcam.update();
    ctx.drawImage(webcam.canvas, 0, 0, 200, 150);
    await predict();
    requestAnimationFrame(loop);
  }
  loop();
}

async function predict() {
  const prediction = await model.predict(webcam.canvas);
  const openIdx = prediction.findIndex(p => p.className.toLowerCase().includes("open")) || 0;
  handProb = prediction[openIdx].probability;

  document.getElementById("prob-open").innerText = handProb.toFixed(2);
  document.getElementById("prob-closed").innerText = (1 - handProb).toFixed(2);

  if (handProb > THRESHOLD && canJump) {
    canJump = false;
    console.log("✋ handJump event wysłany!");
    document.dispatchEvent(new CustomEvent("handJump"));

    document.dispatchEvent(new CustomEvent("handJump"));
    setTimeout(() => canJump = true, JUMP_COOLDOWN_MS);
  }
}

initTeachableMachine().catch(err => {
  alert("Błąd kamery lub modelu: " + err);
});
