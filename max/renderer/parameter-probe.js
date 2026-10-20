/* M0 prototype. Legacy Max js syntax; tested in Node with a simulated LiveAPI only. */
autowatch = 1;
inlets = 1;
outlets = 2;
var target = null;
var generation = 0;
function report(message) { outlet(1, message); }
function disconnect() {
    generation++;
    if (target) { try { target.property = ''; } catch (e) {} }
    target = null;
    report('disconnected');
}
function scalar(api, key) {
    var result = api.get(key);
    if (result === null || typeof result === 'undefined' ||
        (Object.prototype.toString.call(result) === '[object Array]' && result.length === 0))
        throw new Error('target unavailable; bind explicitly');
    return Object.prototype.toString.call(result) === '[object Array]' ? result[0] : result;
}
function index(value) { return typeof value === 'number' && isFinite(value) && value >= 0 && Math.floor(value) === value; }
function bind(track, device, parameter) {
    disconnect();
    if (!index(track) || !index(device) || !index(parameter)) { report('error: indices must be nonnegative integers'); return; }
    bindpath('live_set tracks ' + track + ' devices ' + device + ' parameters ' + parameter);
}
function bindselected() {
    disconnect();
    try {
        var device = new LiveAPI(null, 'live_set view selected_track view selected_device');
        var name = String(device.get('name')).toLowerCase();
        if (!Number(device.id) || device.type !== 'PluginDevice' || name.indexOf('augmented strings') < 0)
            throw new Error('Select Augmented Strings in Live first (keep its original device name)');
        var ids = device.get('parameters');
        var matches = [];
        for (var i = 0; i < ids.length; i++) {
            if (ids[i] === 'id' && Number(ids[i + 1])) {
                var parameter = new LiveAPI(null, 'id ' + ids[++i]);
                if (String(parameter.get('name')).toLowerCase() === 'morph') matches.push(Number(parameter.id));
            }
        }
        if (matches.length !== 1) throw new Error('Expected one exposed Morph parameter; found ' + matches.length);
        bindpath('id ' + matches[0]);
    } catch (e) { disconnect(); report('error: ' + e.message); }
}
function bindpath(path) {
    var token = generation;
    try {
        var candidate = new LiveAPI(function (args) {
            if (token !== generation || !target) return;
            if (args[0] === 'value') outlet(0, 'set', Number(args[1]));
        }, path);
        if (!Number(candidate.id) || candidate.type !== 'DeviceParameter') throw new Error('parameter unavailable');
        target = candidate;
        target.property = 'value';
        report('bound: ' + scalar(target, 'name') + ' range ' + scalar(target, 'min') + ' to ' + scalar(target, 'max'));
        outlet(0, 'set', Number(scalar(target, 'value')));
    } catch (e) { disconnect(); report('error: ' + e.message); }
}
function write(value) {
    try {
        if (!target || !Number(target.id) || target.type !== 'DeviceParameter') throw new Error('target unavailable; bind explicitly');
        if (typeof value !== 'number' || !isFinite(value)) throw new Error('value must be finite');
        if (!Number(scalar(target, 'is_enabled'))) throw new Error('parameter disabled');
        var low = Number(scalar(target, 'min'));
        var high = Number(scalar(target, 'max'));
        if (!isFinite(low) || !isFinite(high) || high < low) throw new Error('invalid range');
        value = Math.max(low, Math.min(high, value));
        if (Number(scalar(target, 'is_quantized'))) value = Math.round(value);
        if (Math.abs(Number(scalar(target, 'value')) - value) > 1e-9) target.set('value', value);
    } catch (e) {
        if (e.message.indexOf('target unavailable') === 0) disconnect();
        report('error: ' + e.message);
    }
}
function notifydeleted() { disconnect(); }
