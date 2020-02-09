const CONFIG_FILE = '/etc/trackingeye/config.json';
const CONFIG_DEFUAULT = '../config.json';

const config = function () {
    try {
        return require(CONFIG_FILE);
    } catch (e) {
        return require(CONFIG_DEFUAULT);
    }
}();


module.exports.config = config;