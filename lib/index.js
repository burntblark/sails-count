var _ = require('lodash');
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');
var pluralize = require('pluralize');

const defaultCountBlueprint = function (req, res) {
    var Model = actionUtil.parseModel(req);

    var countQuery = Model.count(actionUtil.parseCriteria(req));

    countQuery
        .then(function (count) {

            if (req._sails.hooks.pubsub && req.isSocket) {
                if (req.options.autoWatch) {
                    console.log(req.options.autoWatch, 'Subscribed to model changes');
                    Model.watch(req);
                }

                Model.find(actionUtil.parseCriteria(req)).then(matches => {
                    Model.subscribe(req, _.map(matches, Model.primaryKey));
                });
            }
            return res.ok({ count: count })
        });
};

module.exports = function (sails) {
    return {
        initialize: function (cb) {
            var config = sails.config.blueprints;
            var countFn = _.get(sails.middleware, 'blueprints.count') || defaultCountBlueprint;

            sails.on('router:before', function () {
                _.forEach(sails.models, function (model) {
                    var controller = sails.middleware.controllers[model.identity];

                    if (!controller) return;
                    // Validate blueprint config for this controller
                    if (config.prefix) {
                        if (!_(config.prefix).isString()) {
                            return;
                        }
                        if (!config.prefix.match(/^\//)) {
                            config.prefix = '/' + config.prefix;
                        }
                    }

                    // Validate REST route blueprint config for this controller
                    if (config.restPrefix) {
                        if (!_(config.restPrefix).isString()) {
                            return;
                        }
                        if (!config.restPrefix.match(/^\//)) {
                            config.restPrefix = '/' + config.restPrefix;
                        }
                    }

                    var prefix = config.prefix + config.restPrefix;

                    var baseRoute = [prefix, model.identity].join('/');

                    if (config.pluralize && _.get(controller, '_config.pluralize', true)) {
                        baseRoute = pluralize(baseRoute);
                    }

                    var route = baseRoute + '/count';

                    sails.router.bind(route, countFn, null, { controller: model.identity });
                });
            });

            cb();
        }
    }
};