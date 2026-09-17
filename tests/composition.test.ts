import test from 'node:test';
import assert from 'node:assert/strict';
import { applyGesture, coverCrop, gesture, outputSize } from '../src/lib/composition';
test('cover: landscape video is center cropped to portrait without stretching',()=>{
  const c=coverCrop(1920,1080,390,844);assert.equal(c.height,1080);assert.ok(Math.abs(c.width-1080*390/844)<1e-9);assert.ok(Math.abs(c.x-(1920-c.width)/2)<1e-9);assert.equal(c.y,0);
});
test('cover: landscape view and square video crop vertically',()=>{assert.deepEqual(coverCrop(1000,1000,1600,900),{x:0,y:218.75,width:1000,height:562.5});});
test('cover: same ratio uses full source; dimensions are validated',()=>{assert.deepEqual(coverCrop(1920,1080,1280,720),{x:0,y:0,width:1920,height:1080});assert.throws(()=>coverCrop(0,100,200,100));});
test('output bounds memory and preserves portrait or landscape ratio',()=>{assert.deepEqual(outputSize(4000,3000),{width:1920,height:1440});assert.deepEqual(outputSize(1080,1920),{width:1080,height:1920});assert.deepEqual(outputSize(640,480),{width:640,height:480});});
const base={x:0,y:0,scale:1,roll:0,yaw:.5};
test('drag maps pixels to frame coordinates independently of aspect',()=>{const t=applyGesture(base,gesture([{x:10,y:20}]),gesture([{x:60,y:100}]),200,400);assert.equal(t.x,.5);assert.equal(t.y,-.4);assert.equal(t.scale,1);assert.equal(t.roll,0);assert.equal(t.yaw,.5);});
test('pinch and twist adjust scale and roll around a stable midpoint',()=>{const t=applyGesture(base,gesture([{x:0,y:100},{x:200,y:100}]),gesture([{x:100,y:-100},{x:100,y:300}]),400,400);assert.equal(t.x,0);assert.equal(t.y,0);assert.equal(t.scale,2);assert.equal(t.roll,-Math.PI/2);});
test('rebasing when finger count changes creates no jump',()=>{const moved={...base,x:.2,y:.3,scale:1.3,roll:.4};for(const points of [[{x:40,y:50}],[{x:40,y:50},{x:100,y:110}]])assert.deepEqual(applyGesture(moved,gesture(points),gesture(points),400,800),moved);});
test('objects remain recoverable and pinch sizes bounded',()=>{const t=applyGesture(base,gesture([{x:0,y:0},{x:10,y:0}]),gesture([{x:10000,y:-10000},{x:11000,y:-10000}]),100,100);assert.equal(t.x,.88);assert.equal(t.y,.78);assert.equal(t.scale,3);});
