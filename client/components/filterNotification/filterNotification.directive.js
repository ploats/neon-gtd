'use strict';

/*
 * Copyright 2016 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

angular.module('neonDemo.directives').directive('filterNotification', function() {
    return {
        templateUrl: 'components/filterNotification/filterNotification.html',
        transclude: true,
        scope: {
            getFilterData: '=',
            getFilterDesc: '=?',
            getFilterText: '=?',
            getLinksPopupKey: '=?',
            getLinksPopupJson: '=?',
            removeFilter: '=',
            showLinksPopupButton: '=?',
            visualizationId: '='
        },
        link: function($scope) {
            $scope.getFilterDesc = $scope.getFilterDesc || function(value) {
                return value;
            };

            $scope.getFilterText = $scope.getFilterText || function(value) {
                return value;
            };
        }
    };
});