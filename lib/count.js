/**
 * Module dependencies
 */
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
module.exports = function count(req, res) {
    var Model = actionUtil.parseModel(req);
    var criteria = actionUtil.parseCriteria(req);

    Model.count(criteria).then((count) => {
        res.ok(count);
    }).catch(res.negotiate);
};
