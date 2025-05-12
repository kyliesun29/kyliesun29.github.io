// Animation globals for the cat
let g_headnodYES_angle = 0;
let g_headnodNO_angle = 0;
let g_headnodCURIOUS_angle = 0;
let g_lowerbody_angle = 0;
let g_tailAngle1 = 0;
let g_tailAngle2 = 0;
let g_tailAngle3 = 0;
let g_backLeftLegAngle = 0;
let g_backRightLegAngle = 0;
let g_frontLeftLegAngle = 0;
let g_frontRightLegAngle = 0;
let g_bodyBounce = 0;

function updateCatAnimation(seconds) {
  g_tailAngle1 = 15 * Math.sin(seconds * 2);
  g_tailAngle2 = 10 * Math.sin(seconds * 3);
  g_tailAngle3 = 5 * Math.sin(seconds * 4);
  g_headnodYES_angle = 3 * Math.sin(seconds * 1.5);
  g_bodyBounce = 0.02 * Math.sin(seconds * 3);
}
