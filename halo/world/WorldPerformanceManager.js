export class WorldPerformanceManager {
  constructor({threshold=80,samples=90}={}){this.threshold=threshold;this.samples=samples;this.reset();}
  reset(){this.total=0;this.count=0;}
  sample(milliseconds){
    this.total+=milliseconds;this.count++;
    if(this.count<this.samples)return false;
    const slow=this.total/this.count>this.threshold;this.reset();return slow;
  }
}
