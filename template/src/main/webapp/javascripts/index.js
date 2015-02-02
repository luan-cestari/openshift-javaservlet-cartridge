$(document).ready(function(){

    // Start & Stop button controlls
    var playAnimation = true;
    // Keyboard Variables
    var leftKey = 37;
    var upKey = 38;
    var rightKey = 39;
    var downKey = 40;

    var position = 0;
    var pathArray;// = getPathArray();
    var polypoints;// = makePolyPoints(pathArray);

    // Canvas Variables
    var canvas = $('#canvas1');
    var context = canvas.get(0).getContext('2d');
    var canvasWidth = canvas.width();
    var canvasHeight = canvas.height();
    var svgWidth = $(window).get(0).innerWidth - 0.5 * $(window).get(0).innerWidth;
    var svgHeight = $(window).get(0).innerHeight - 0.04 * $(window).get(0).innerHeight;
    var svgX = 0.04 * $(window).get(0).innerWidth;
    var svgY = 0.0 * $(window).get(0).innerHeight;

    $('#svg').attr('width', svgWidth);
    $('#svg').attr('height', svgHeight);

    $('#svg g:first-child').attr('transform', 'translate(' + svgX + ',' + svgY + ')');

    $('#sliderW').attr('min', 100);
    $('#sliderW').attr('max', svgWidth*2);
    $('#sliderW').attr('value', svgWidth);
    $('#sliderW').attr('step', svgWidth*0.05);

    $('#sliderX').attr('min', -svgWidth/2);
    $('#sliderX').attr('max', svgWidth/2);
    $('#sliderX').attr('value', svgX);
    $('#sliderX').attr('step', svgWidth*0.05);

    $('#sliderY').attr('min', - svgHeight*0.5 );
    $('#sliderY').attr('max',   svgHeight*0.5);
    $('#sliderY').attr('value', svgY);
    $('#sliderY').attr('step', svgHeight*0.05);

    var diff;
    var previous;
    $('#sliderW').on('focus', function () {
        previous = this.value;
    }).change(function() {
        svgWidth = $('#sliderW').val();
        diff = (previous - svgWidth) / previous;
        if(diff < 0) {
            svgHeight = svgHeight + svgHeight * -diff;
        } else {
            svgHeight = svgHeight - svgHeight * diff;
        }
        $('#svg')[0].setAttribute('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight);
        previous = this.value;
    });

    $('#sliderX').change(function() {
        svgX = $('#sliderX').val();
        $('#svg g:first-child').attr('transform', 'translate(' + svgX + ',' + svgY + ')');
    });

    $('#sliderY').change(function() {
        svgY = $('#sliderY').val();
        $('#svg g:first-child').attr('transform', 'translate(' + svgX + ',' + svgY + ')');
    });



    // Get (x, y) points from a path segment or more
    function pathToPoints(segments) {
        var count = segments.numberOfItems;
        var result = [], segment, x, y;
        for (var i = 0; i < count; i++) {
            segment = segments.getItem(i);
            switch(segment.pathSegType) {
                case SVGPathSeg.PATHSEG_MOVETO_ABS:
                case SVGPathSeg.PATHSEG_LINETO_ABS:
                case SVGPathSeg.PATHSEG_CURVETO_CUBIC_ABS:
                case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_ABS:
                case SVGPathSeg.PATHSEG_ARC_ABS:
                case SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_ABS:
                case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_ABS:
                    x = segment.x;
                    y = segment.y;
                    break;

                case SVGPathSeg.PATHSEG_MOVETO_REL:
                case SVGPathSeg.PATHSEG_LINETO_REL:
                case SVGPathSeg.PATHSEG_CURVETO_CUBIC_REL:
                case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_REL:
                case SVGPathSeg.PATHSEG_ARC_REL:
                case SVGPathSeg.PATHSEG_CURVETO_CUBIC_SMOOTH_REL:
                case SVGPathSeg.PATHSEG_CURVETO_QUADRATIC_SMOOTH_REL:
                    x = segment.x;
                    y = segment.y;
                    if (result.length > 0) {
                        x += result[result.length - 1].x;
                        y += result[result.length - 1].y;
                    }
                    break;

                case SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_ABS:
                    x = segment.x;
                    y = result[result.length - 1].y;
                    break;
                case SVGPathSeg.PATHSEG_LINETO_HORIZONTAL_REL:
                    x = result[result.length - 1].x + segment.x;
                    y = result[result.length - 1].y;
                    break;

                case SVGPathSeg.PATHSEG_LINETO_VERTICAL_ABS:
                    x = result[result.length - 1].x;
                    y = segment.y;
                    break;
                case SVGPathSeg.PATHSEG_LINETO_VERTICAL_REL:
                    x = result[result.length - 1].x;
                    y = segment.y + result[result.length - 1].y;
                    break;
                case SVGPathSeg.PATHSEG_CLOSEPATH:
                    return result;
                default:
                    console.log('unknown path command: ', segment.pathSegTypeAsLetter);
            }
            result.push({
                x: x,
                y: y
            });
        }
        return result;
    }

    function getPathArray(p) {
        //var svg = document.querySelector('#svg');
        //var path = document.querySelector('#svg path');
        //var points = pathToPoints(path.pathSegList);
        //return points;
        return p;
    }


    function makePolyPoints(pathArray) {
        var points = [];
        for (var i = 1; i < pathArray.length; i++) {
            var startPt = pathArray[i - 1];
            var endPt = pathArray[i];
            var dx = endPt.x - startPt.x;
            var dy = endPt.y - startPt.y;
            for (var n = 0; n <= 100; n++) {
                var x = startPt.x + dx * n / 100;
                var y = startPt.y + dy * n / 100;
                points.push({
                    x: x,
                    y: y
                });
            }
        }
        return (points);
    }




    // Keyboard event listeners
    $(window).keydown(function(e){
        var keyCode = e.keyCode;
        if(keyCode == leftKey){
            car.left = true;
        } else if(keyCode == upKey){
            car.forward = true;
        } else if(keyCode == rightKey){
            car.right = true;
        } else if (keyCode == downKey){
            car.backward = true;
        }
    });
    $(window).keyup(function(e){
        var keyCode = e.keyCode;
        if(keyCode == leftKey){
            car.left = false;
        } else if(keyCode == upKey){
            car.forward = false;
        } else if(keyCode == rightKey){
            car.right = false;
        } else if (keyCode == downKey){
            car.backward = false;
        }
    });



    // Resize canvas to full screen
    function resizeCanvas(){
        canvas.attr('width', $(window).get(0).innerWidth - 0.5 * $(window).get(0).innerWidth);
        canvas.attr('height', $(window).get(0).innerHeight - 0.0 * $(window).get(0).innerHeight);
        canvasWidth = canvas.width();
        canvasHeight = canvas.height();
        $('#canvasRace')[0].setAttribute('width', $(window).get(0).innerWidth - 0.5 * $(window).get(0).innerWidth);
        $('#canvasRace')[0].setAttribute('height', $(window).get(0).innerHeight - 0.0 * $(window).get(0).innerHeight);
    }

    resizeCanvas();

    $(window).resize(resizeCanvas);


    function initialise(){
        initStageObjects();
        drawStageObjects();
        updateStage();
    }


    // Car object and properties
    function Car(src, x, y){
        this.image = new Image();
        this.image.src = src;

        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 90;

        this.topSpeed = 15;

        this.topDrift = 34;
        // Seems to be a nice proportion, since the topDrift are like 34, 45, 56, 67, 78...
        this.minDrift = Math.floor(this.topDrift / 10); // for control pourpose only
        this.driftGearStick = this.topDrift % 10;       // for control pourpose only

        this.acceleration = 0.1;
        this.reverse = 0.1;
        this.brakes = 0.3;
        this.friction = 0.05;
        this.handeling = 15;
        this.grip = 15;
        this.minGrip = 5;
        this.speed = 0;
        this.drift = 0;

        this.left = false;
        this.up = false;
        this.right = false;
        this.down = false;
    }


    // Create any objects needed for animation
    function initStageObjects(){
        car = new Car('images/car.png',canvas.width()/2,canvas.height()/2);
    }


    function drawStageObjects(){
        context.save();
        context.translate(car.x,car.y);
        context.rotate((car.angle + car.drift) * Math.PI/180);
        context.drawImage(car.image, -25 , (-47 + (Math.abs(car.drift / 3))));
        // context.fillRect(-5, -5, 10, 10);
        context.restore();
    }


    function clearCanvas(){
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.beginPath();
    }


    function updateStageObjects(){

        // Faster the car is going, the worse it handels
        if(car.handeling > car.minGrip){
            car.handeling = car.grip - car.speed;
        }
        else{
            car.handeling = car.minGrip + 1;
        }


        // Car acceleration to top speed
        if(car.forward){
            if(car.speed < car.topSpeed){
                car.speed = car.speed + car.acceleration;
            }
        }
        else if(car.backward){
            if(car.speed < 1 && -car.speed < car.topSpeed){
                car.speed = car.speed - car.reverse;
            }
            else if(car.speed > 1){
                car.speed = car.speed - car.brakes;
            }
        }


        // Car drifting logic (still working on it...)
        if (car.forward) {
            // If car reach 90% the very own speed, then start drifting
            if(car.left && car.speed > (car.topSpeed * 0.90) && car.drift > -car.topDrift){
                car.drift = car.drift - car.driftGearStick;
            }
            else if(car.right && car.speed > (car.topSpeed * 0.90) && car.drift < car.topDrift){
                car.drift = car.drift + car.driftGearStick;
            }
        } else {
            if(car.drift < -car.minDrift){
                car.drift = car.drift + car.driftGearStick;
            } else  if(car.drift > car.minDrift){
                car.drift = car.drift - car.driftGearStick;
            }
        }

        // General car handeling when turning
        if(car.left){
            car.angle = car.angle - (car.handeling * car.speed/car.topSpeed);
        } else if(car.right){
            car.angle = car.angle + (car.handeling * car.speed/car.topSpeed);
        }

        // Constant application of friction / air resistance
        if(car.speed > 0){
            car.speed = car.speed - car.friction;
        } else if(car.speed < 0) {
            car.speed = car.speed + car.friction;
        }

        // Update car velocity (speed + direction)
        car.vy = -Math.cos(car.angle * Math.PI / 180) * car.speed;
        car.vx = Math.sin(car.angle * Math.PI / 180) * car.speed;


        // Plot the new velocity into x and y cords
         if(position < polypoints.length) {
            var pt = polypoints[Math.round(position)];
            car.y = pt.y + car.vy;
            car.x = pt.x + car.vx;
            position+= car.speed;
         } else if($('#freeMode')[0].checked) {
            car.y = car.y + car.vy;
            car.x = car.x + car.vx;
        }

    }


    // Main animation loop
    function updateStage(){
        clearCanvas();
        updateStageObjects();
        drawStageObjects();

        if(playAnimation){
            setTimeout(updateStage, 25);
        }
    }


    loadHistory();

    initRace();

    function transformPoints(){
        result = [];
        var arrayLength = p.length;
        var x,y;
        var first=true;
        for (var i = 0; i < arrayLength; i++) {
            if(first){
                first = false;
                x=p[i];
            }else{
                first=true;
                y=p[i];
                result.push({
                    x: x,
                    y: y
                });
            }
        }
        return result;
    }

    var once = true;
    if(window.location.hash) {
        var hash = window.location.hash.substring(1);

        $("#saveRace").hide();
        $('<button id="save2">Save&Play Against</button>').insertBefore($("#saveRace") )
        $("#save2").click(function(){

            once = false;
            p = getGeneratedPath();
            result = transformPoints(p);
            var raceJson;
            $.ajax({
                type: "GET",
                url: "api/races/"+hash,
                data: "{}",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    console.log(response);
                    raceJson = response;

                    raceJson.playerTwoName = $("#playerName").val();
                    raceJson.secondRaceDots=p;
                    $.ajax({
                        type: "POST",
                        url: "api/races/"+raceJson.sessionKey,
                        data: JSON.stringify(raceJson),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function (response) {
                            console.log(response);
                            raceJson = response;

                            pathArray = getPathArray(result);
                            polypoints = makePolyPoints(pathArray);
                            initialise();
//TODO create as second canvas with another car and make both move togueter
//TODO timer for both cars
                        },
                        error: function (response) {
                            $("#history").append("<li>error<li>");
                            console.log(response);
                        }
                    });
                },
                error: function (response) {
                    $("#history").append("<li>error<li>");
                    console.log(response);
                }
            });
        });
    }

    $("#saveRace").click(function(){
        if(once){
            once = false;
            p = getGeneratedPath();
            result = transformPoints(p);
            var raceJson;
            $.ajax({
                type: "POST",
                url: "api/races/create",
                data: "{}",
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    console.log(response);
                    raceJson = response;

                    raceJson.playerOneName = $("#playerName").val();
                    raceJson.firstRaceDots=p;
                    $.ajax({
                        type: "POST",
                        url: "api/races/"+raceJson.sessionKey,
                        data: JSON.stringify(raceJson),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function (response) {
                            console.log(response);
                            raceJson = response;

                            pathArray = getPathArray(result);
                            polypoints = makePolyPoints(pathArray);
                            initialise();
                        },
                        error: function (response) {
                            $("#history").append("<li>error<li>");
                            console.log(response);
                        }
                    });
                },
                error: function (response) {
                    $("#history").append("<li>error<li>");
                    console.log(response);
                }
            });
        }
    });
});

function getGeneratedPath() {
    return pts;
}

function initRace() {
    canvas = $("#canvasRace")[0];
    ctx = canvas.getContext("2d");
    canvas.onclick = function(e) {
        var p = mousePositionOnCanvas(e);
        addSplinePoint(p.x, p.y);
    };
}

function loadHistory() {
    $.ajax({
        type: "GET",
        url: "api/races",
        data: "{}",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            console.log(response);
            var races = response.races;
            $('#history').empty();
            $("#history").append("<ul style='list-style: inherit;'></ul> ");
            $("#history ul").append("<li><span style='font-weight:bolder;'>ID - First Player Name - Status</span></li>");
            $.each(races, function(id,race) {
                $("#history ul").append("<li><a target='_blank' href='#"+race.sessionKey+"'><span>"+race.sessionKey.substring(0,5)+" - "+race.firstPlayerName+" - "+race.status+ " </a></span></li>");
            });
        },
        error: function (response) {
            $("#history").append("<li>error<li>");
            console.log(response);
        }
    });
}


//based http://jsbin.com/ApitIxo/2/

var canvas ,  ctx ;
var pts = []; // a list of x and ys

function mousePositionOnCanvas(e) {
    var el = e.target,
        c = el;
    var scaleX = c.width / c.offsetWidth || 1;
    var scaleY = c.height / c.offsetHeight || 1;

    if (!isNaN(e.offsetX))
        return {
            x: e.offsetX * scaleX,
            y: e.offsetY * scaleY
        };

    var x = e.pageX,
        y = e.pageY;
    do {
        x -= el.offsetLeft;
        y -= el.offsetTop;
        el = el.offsetParent;
    } while (el);
    return {
        x: x * scaleX,
        y: y * scaleY
    };
}

function drawPoint(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill()
    ctx.restore();
}


// given an array of x,y's, return distance between any two,
// note that i and j are indexes to the points, not directly into the array.
function dista(arr, i, j) {
    return Math.sqrt(Math.pow(arr[2 * i] - arr[2 * j], 2) + Math.pow(arr[2 * i + 1] - arr[2 * j + 1], 2));
}

function va(arr, i, j) {
    return [arr[2 * j] - arr[2 * i], arr[2 * j + 1] - arr[2 * i + 1]]
}

function ctlpts(x1, y1, x2, y2, x3, y3) {
    var t = 0.5;
    var v = va(arguments, 0, 2);
    var d01 = dista(arguments, 0, 1);
    var d12 = dista(arguments, 1, 2);
    var d012 = d01 + d12;
    return [x2 - v[0] * t * d01 / d012, y2 - v[1] * t * d01 / d012,
        x2 + v[0] * t * d12 / d012, y2 + v[1] * t * d12 / d012
    ];
}

function addSplinePoint(x, y) {
    pts.push(x);
    pts.push(y);
    drawSplines();
}

function drawSplines() {
    clear();
    // console.log(pts);
    cps = []; // There will be two control points for each "middle" point, 1 ... len-2e
    for (var i = 0; i < pts.length - 2; i += 1) {
        cps = cps.concat(ctlpts(pts[2 * i], pts[2 * i + 1], pts[2 * i + 2], pts[2 * i + 3], pts[2 * i + 4], pts[2 * i + 5]));
    }

    drawCurvedPath(cps, pts);

}

function drawControlPoints(cps) {
    for (var i = 0; i < cps.length; i += 4) {
        showPt(cps[i], cps[i + 1], "white");
        showPt(cps[i + 2], cps[i + 3], "white");
        drawLine(cps[i], cps[i + 1], cps[i + 2], cps[i + 3], "white");
    }
}

function drawPoints(pts) {
    for (var i = 0; i < pts.length; i += 2) {
        showPt(pts[i], pts[i + 1], "black");
    }
}

function drawCurvedPath(cps, pts) {

    // console.log("pts", pts, "cps", cps);
    var len = pts.length / 2; // number of points
    if (len < 2) return;
    if (len == 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        ctx.lineTo(pts[2], pts[3]);
        ctx.stroke();
    } else {

        ctx.beginPath();
        ctx.moveTo(pts[0], pts[1]);
        // from point 0 to point 1 is a quadratic
        ctx.quadraticCurveTo(cps[0], cps[1], pts[2], pts[3]);
        // for all middle points, connect with bezier
        for (var i = 2; i < len - 1; i += 1) {
            // console.log("to", pts[2*i], pts[2*i+1]);
            ctx.bezierCurveTo(cps[(2 * (i - 1) - 1) * 2], cps[(2 * (i - 1) - 1) * 2 + 1],
                cps[(2 * (i - 1)) * 2], cps[(2 * (i - 1)) * 2 + 1],
                pts[i * 2], pts[i * 2 + 1]);
        }
        ctx.quadraticCurveTo(cps[(2 * (i - 1) - 1) * 2], cps[(2 * (i - 1) - 1) * 2 + 1],
            pts[i * 2], pts[i * 2 + 1]);
        ctx.stroke();

    }

}

function clear() {
    ctx.save();
    // use alpha to fade out
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function showPt(x, y, fillStyle) {
    // console.log("showPt", x, y);
    ctx.save();
    ctx.beginPath();
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
    }
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
}

function drawLine(x1, y1, x2, y2, strokeStyle) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (strokeStyle) {
        ctx.save();
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
        ctx.restore();
    } else {
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.stroke();
        ctx.restore();
    }
}
