const util = require('util')
const fs = require('fs')
const PF = require('pathfinding');

const LOGFILENAME = "log.log"
const MAPDIR = "./maps/"
var listOfPathFinderFunctions = [
    "AStarFinder",
    "BestFirstFinder",
    "BreadthFirstFinder",
    "DijkstraFinder",
    // "IDAStarFinder",
    "JumpPointFinder",
    // "OrthogonalJumpPointFinder",
    "BiAStarFinder",
    "BiBestFirstFinder",
    "BiBreadthFirstFinder",
    "BiDijkstraFinder"]

function getFileMatrix(fileName){
    let result = []
    let arrays = fs.readFileSync(fileName, 'utf8').toString().split("\r\n");
    for (i in arrays){
        let buf = []
        for (j in arrays[i]){
            buf.push(parseInt(arrays[i][j]))
        }
        result.push(buf);
    }
    return result
}

function getRandomBool(nullChance) {
    let generateValue = Math.random() * Math.floor(100)
    return generateValue < nullChance ? '0' : '1'
  }

function generateMatrix(matrixDimension, nullChance){
    let matrix = []
    for (let i = 0; i < matrixDimension; i++){
        matrix.push([])
        for (let j = 0; j < matrixDimension; j++){
            let randomBool = getRandomBool(nullChance)
            matrix[i].push(randomBool)
        }
    }
    return matrix
}
function convertMatrixToString(matrix){
    resultString = ""
    for (let i = 0; i < matrix.length; i++){
        resultString += matrix[i] + "\n"
    }
    resultString = resultString.slice(0, -1)
    return resultString
}
function saveMatrixToFile(fileName, matrix, start, goal){
    let saveString = convertMatrixToString(matrix)
    saveString += util.format("\n%s,%s,%s,%s", start[0].toString(), start[1].toString(), goal[0].toString(), goal[1].toString())
    let fullFileName = MAPDIR + fileName + ".txt"
    fs.writeFile(fullFileName, saveString, function(err){
        if (err) return console.log(err)
    })
    console.log("Matrix save into " + fullFileName)
}

function testMatrix(matrix, testIterations){
    var grid = new PF.Grid(matrix);
    var finder = new PF.AStarFinder();
    let halfOfMatrixSIze = matrix.length / 2
    for (let i = 0; i < testIterations; i++){
        let [startX, startY] = getEmptyPointOnMatrix(matrix)
        let [goalX, goalY] = getEmptyPointOnMatrix(matrix)
        var path = finder.findPath(startX, startY, goalX, goalY, grid);
        if (path.length > 0 && checkTwoPointsDistance([startX, startY], [goalX, goalY], halfOfMatrixSIze)){
            return [matrix, [startX, startY], [goalX, goalY]]
        }
    }
    return null
}

function checkTwoPointsDistance(A, B, distance){
    if (Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2) > Math.pow(distance, 2)){
        return true
    }
    return false
}

function convertStringMatrixToInt(stringMatrix){
    let intMatrix = []
    for (let i = 0; i < stringMatrix.length; i++){
        intMatrix.push([])
        for (let j = 0; j < stringMatrix[0].length; j++){
            intMatrix[i].push(parseInt(stringMatrix[i][j]))
        }
    }
    return intMatrix
}
function getEmptyPointOnMatrix(matrix){
    while (true){
        let generateX = Math.floor(Math.random() * Math.floor(matrix.length))
        let generateY = Math.floor(Math.random() * Math.floor(matrix.length))
        if (matrix[generateX][generateY] == '0'){
            return [generateX, generateY]
        }
    }
}

function generateMapFile(mapNumber, mapSize, nullChance, testIterations){
    let mapName = util.format("%s_%s_%s", mapNumber, mapSize, nullChance)
    while (true){
        let matrix = generateMatrix(mapSize, nullChance)
        let intMatrix = convertStringMatrixToInt(matrix)
        result = testMatrix(intMatrix, testIterations)
        if (result != null){
            saveMatrixToFile(mapName, result[0], result[1], result[2])
            break
        }
    }
}

function generateMultipleMaps(countOfMaps, mapSize, nullChance, testIterations){
    for (let i = 0; i < countOfMaps; i++){
        console.log(util.format("preparing mapSize: %s, nullChance: %s - %s/%s", mapSize, nullChance, i + 1, countOfMaps))
        generateMapFile(i.toString(), mapSize, nullChance, testIterations)
    }
}

function getDataFromMap(mapName){
    let fullMapName = MAPDIR + mapName
    let content = fs.readFileSync(fullMapName, 'utf8')
    stringMatrix = []
    for (let i of content.split("\n")){
        stringMatrix.push(i.split(","))
    }
    let startANdGoalString = stringMatrix.pop()
    let intMatrix = convertStringMatrixToInt(stringMatrix)
    let start = startANdGoalString.slice(0,2).map(function (x) {
        return parseInt(x, 10);
      });
    let goal = startANdGoalString.slice(2,4).map(function (x) {
        return parseInt(x, 10);
      });
    return [intMatrix, start, goal]
}

function writeStringToLOgFile(stringToWrite){
    fs.appendFileSync(LOGFILENAME, stringToWrite)
}
function applyPFFunctionToMatrix(functionName, matrix, start, goal, mapName){
    let [startX, startY] = start
    let [goalX, goalY] = goal
    var grid = new PF.Grid(matrix);
    let performingString = util.format("new PF.%s", functionName)
    var finder = eval(performingString)
    var timeStart = Date.now();
    var path = finder.findPath(startX, startY, goalX, goalY, grid);
    var timeEnd = Date.now();
    var stringToWrite = util.format("-- %s -- %s -- %s -- %s\n", mapName, functionName, path.length, (timeEnd - timeStart).toString())
    console.log(stringToWrite)
    writeStringToLOgFile(stringToWrite)
}

function copyMap(mapData){
    var matrix = mapData[0].slice()
    var start = mapData[1]
    var goal = mapData[2]
    return [matrix, start, goal]
}

//Use to generate maps generateMultipleMaps(countOfMaps, mapSize, nullChance, testIterations)
// generateMultipleMaps(10, 5000, 55, 100)

let listOfNullChance = ["60", "65", "70", "75", "80", "85", "90", "95"]
for (let nullChance of ["75"]){
    for (let j = 0; j < 10; j++){
        let mapName = util.format("%s_5000_%s.txt", j, nullChance)
        console.log(util.format("collecting data from %s", mapName))
        mapData = getDataFromMap(mapName)

        for (let functionName of listOfPathFinderFunctions){
            [matrix, start, goal] = copyMap(mapData)
            console.log(util.format("applying %s function to %s map"), functionName, mapName)
            applyPFFunctionToMatrix(functionName, matrix, start, goal, mapName)
        }
    }
}

// map generation time
// 23 min for 60% nulls chance rate
// 25 min for 70% nulls chance rate
// 21 min for 80% nulls chance rate
// 22 min for 90% nulls chance rate

//path finding time
//00-50 60%
//55-50 65%
//48-