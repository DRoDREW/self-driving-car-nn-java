const carCanvas=document.getElementById("carCanvas");
carCanvas.width=200;
const networkCanvas=document.getElementById("networkCanvas");
networkCanvas.width=300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road=new Road(carCanvas.width/2,carCanvas.width*0.9);

const N=100;
let cars=generateCars(N);
let bestCar=cars[0];
let generation=0;
let traffic=createTraffic();

if(localStorage.getItem("bestBrain")){
    for(let i=0;i<cars.length;i++){
        cars[i].brain=JSON.parse(
            localStorage.getItem("bestBrain"));
        if(i!=0){
            NeuralNetwork.mutate(cars[i].brain,0.1);
        }
    }
}

animate();

function save(){
    generation++;
    console.log(`Skipped to Generation ${generation}! Best overtakes: ${bestCar.overtakeCount}`);
    cars=regenerateCars(bestCar.brain);
    traffic=createTraffic();
    localStorage.setItem("bestBrain",
        JSON.stringify(bestCar.brain));
}

function discard(){
    localStorage.removeItem("bestBrain");
}

function generateCars(N){
    const cars=[];
    for(let i=0;i<N;i++){
        cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"));
    }
    return cars;
}

function createTraffic(){
    return [
        new Car(road.getLaneCenter(1),-100,30,50,"DUMMY",2,getRandomColor()),
        new Car(road.getLaneCenter(0),-300,30,50,"DUMMY",2,getRandomColor()),
        new Car(road.getLaneCenter(2),-300,30,50,"DUMMY",2,getRandomColor()),
        new Car(road.getLaneCenter(0),-500,30,50,"DUMMY",2,getRandomColor()),
        new Car(road.getLaneCenter(1),-500,30,50,"DUMMY",2,getRandomColor()),
        new Car(road.getLaneCenter(1),-700,30,50,"DUMMY",2,getRandomColor()),
        new Car(road.getLaneCenter(2),-700,30,50,"DUMMY",2,getRandomColor()),
    ];
}

function regenerateCars(bestCarBrain){
    const cars=[];
    cars.push(new Car(road.getLaneCenter(1),100,30,50,"AI"));
    cars[0].brain=JSON.parse(JSON.stringify(bestCarBrain));
    
    for(let i=1;i<N;i++){
        const car=new Car(road.getLaneCenter(1),100,30,50,"AI");
        car.brain=JSON.parse(JSON.stringify(bestCarBrain));
        NeuralNetwork.mutate(car.brain,0.1);
        cars.push(car);
    }
    return cars;
}

function animate(time){
    for(let i=0;i<traffic.length;i++){
        traffic[i].update(road.borders,[]);
    }
    for(let i=0;i<cars.length;i++){
        cars[i].update(road.borders,traffic);
    }
    
    // Fitness function that HEAVILY rewards overtaking and proximity to traffic
    bestCar=cars.reduce((best, car) => {
        let carScore = (car.overtakeCount * 10000) + (-car.y * 0.5) + (200 - Math.min(car.closestTrafficDistance, 200));
        let bestScore = (best.overtakeCount * 10000) + (-best.y * 0.5) + (200 - Math.min(best.closestTrafficDistance, 200));
        return carScore > bestScore ? car : best;
    });

    // Check if all cars are damaged
    const allCarsDamaged=cars.every(car=>car.damaged);
    if(allCarsDamaged){
        generation++;
        console.log(`Generation ${generation} complete! Best overtakes: ${bestCar.overtakeCount}, Score: ${Math.round((bestCar.overtakeCount * 10000) + (-bestCar.y * 0.5) + (200 - Math.min(bestCar.closestTrafficDistance, 200)))}`);
        cars=regenerateCars(bestCar.brain);
        traffic=createTraffic();
    }

    carCanvas.height=window.innerHeight;
    networkCanvas.height=window.innerHeight;

    carCtx.save();
    carCtx.translate(0,-bestCar.y+carCanvas.height*0.7);

    road.draw(carCtx);
    for(let i=0;i<traffic.length;i++){
        traffic[i].draw(carCtx);
    }
    carCtx.globalAlpha=0.2;
    for(let i=0;i<cars.length;i++){
        cars[i].draw(carCtx);
    }
    carCtx.globalAlpha=1;
    bestCar.draw(carCtx,true);

    carCtx.restore();
    
    // Display generation info
    carCtx.fillStyle="white";
    carCtx.font="20px Arial";
    carCtx.fillText(`Generation: ${generation}`,10,30);
    carCtx.fillText(`Overtakes: ${bestCar.overtakeCount}`,10,60);
    carCtx.fillText(`Closest Distance: ${Math.round(bestCar.closestTrafficDistance)}`,10,90);

    networkCtx.lineDashOffset=-time/50;
    Visualizer.drawNetwork(networkCtx,bestCar.brain);
    requestAnimationFrame(animate);
}