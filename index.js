var cmis = require('./dist/cmis').cmis;
for (var ex in cmis){
    exports[ex] = cmis[ex];
}