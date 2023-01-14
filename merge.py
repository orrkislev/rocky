import os

files1 = [
    '1 - utils.js',
    '2 - projections.js',
    '3 - main.js',
]
files2 = [
    '4 - shaders.js',
    '5 - patterns.js',
    '6 - heightmap.js',
]

def mergeFiles(fileNames, outputFileName):
    with open(outputFileName, 'wb') as outputFile:
        for fileName in fileNames:
            with open(fileName, 'rb') as inputFile:
                outputFile.write(inputFile.read())
            #add a new line after each file
            outputFile.write("\n\n".encode('utf-8'))
            

mergeFiles(files1, 'build/1.js')
os.system('uglifyjs build/1.js -o build/1.min.js')

mergeFiles(files2, 'build/2.js')
os.system('uglifyjs build/2.js -o build/2.min.js')