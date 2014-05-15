'use strict';

/* Controllers */

var analyticsControllers = angular.module('analyticsControllers', []);

/**
 * Dashboard Controller 
 */
analyticsControllers.controller('DashboardCtrl', ['$scope', 'KApi', 'DashboardSvc', 
    function($scope, KApi, DashboardSvc) {
		
		/**
		 * entries currently on display
		 */
		var entries = [];
		
		/**
		 * number of entries in page
		 */
		var pageSize = 5;
		
		/**
		 * total number of pages
		 */
		var totalPages = 1;
		
		
		var updatePagingControlRequired = true;
		
		
		/**
		 * get data for the aggregates line
		 */
		var getAggregates = function getAggregates(liveOnly) {
			DashboardSvc.getAggregates(liveOnly).then (function(data) {
				var o = data.objects[0];
				var results = [
				           	{"title": "audience", "value": liveOnly ? o.audience : o.plays},
				        	{"title": "seconds_viewed", "value": o.secondsViewed},
				        	{"title": "buffertime", "value": o.bufferTime},
				        	{"title": "bitrate", "value": o.avgBitrate}
				        ]; 
				
				$scope.aggregates = results;
			});
		};
		
		
		/**
		 * @param liveOnly	fetch KalturaLive currently live (true) or all live entries (false)
		 * @param pageNumber index of page to fetch
		 */
		var getEntries = function getEntries(liveOnly, pageNumber) {
			var result;
			if (liveOnly) {
				result = DashboardSvc.getLiveEntries(pageNumber); 
			}
			else {
				result = DashboardSvc.getAllEntries(pageNumber); 
			}
			 
			result.then(function(data) {
				$scope.entries = data.objects;
				totalPages = Math.ceil(data.totalCount/pageSize);
				if (updatePagingControlRequired) {
					updatePagingControl(pageNumber, totalPages);
					updatePagingControlRequired = false;
				}
			});
		};
		
		
		/**
		 * get entries data by page
		 * @param e
		 * @param oldPage
		 * @param newPage
		 */
		var doPaging = function doPaging(e,oldPage,newPage) {
			getEntries($scope.boardType == "liveOnly", newPage);
		};
		
		
		/**
		 * update paging control
		 * @param current	index of current page
		 * @param total		total number of pages
		 */
		var updatePagingControl = function updatePagingControl(current, total) {
			var options = {
	                currentPage: current,
	                totalPages: total
	            };
	        $('#pagination').bootstrapPaginator(options);
		};
		
		
		/**
		 * initial screen set up
		 */
		var screenSetup = function screenSetup() {
			// set report dates:
			var d = new Date();
			$scope.nowTime = d;
			d = new Date();
			d.setHours(d.getHours() - 36);
			$scope.reportStartTime = d;
			
			var options = {
					bootstrapMajorVersion: 3,
					onPageChanged: doPaging,
					shouldShowPage:function(type, page, current){
		                switch(type) {
		                    case "first":
		                    case "last":
		                        return false;
		                    default:
		                        return true;
		                }
		            },
		            alignment: 'center',
		            currentPage: 1,
		            totalPages: totalPages
		    };
	
		    $('#pagination').bootstrapPaginator(options);
		    
		    $scope.boardType = "all";
			$scope.$watch("boardType", function(newValue, oldValue) {
				getAggregates(newValue == "liveOnly");
	    		getEntries(newValue == "liveOnly", 1);
				updatePagingControlRequired = true;
			 });
		};
		
		screenSetup();
		
    }]);


/**
 * General controller for the entry drill-down page
 */
analyticsControllers.controller('EntryCtrl', ['$scope', '$rootScope', '$routeParams', '$interval', 'EntrySvc', 
    function($scope, $rootScope, $routeParams, $interval, EntrySvc) {
		$scope.intervalPromise = null; 			// use this to hold update interval
		$scope.entryId = $routeParams.entryid;	// current entry
		$scope.pid = 346151;
		$scope.uiconfId = 22767782;
		$scope.playerEntryId = '';				// entry that should be shown in player (live / vod)
		

		/**
		 * get data for the aggregates line
		 * @param isLive is the entry currently broadcasting
		 */
		var getAggregates = function getAggregates(isLive) {
			EntrySvc.getAggregates($scope.entryId, isLive).then (function(data) {
				var o = data.objects[0];
				var results = [
				           	{"title": "audience", "value": isLive ? o.audience : o.plays},
				        	{"title": "seconds_viewed", "value": o.secondsViewed},
				        	{"title": "buffertime", "value": o.bufferTime},
				        	{"title": "bitrate", "value": o.avgBitrate}
				        ]; 
				
				$scope.aggregates = results;
				getReferrers(isLive ? o.audience : o.plays);
			});
		};
		
		
		/**
		 * get data for the top referrals table
		 * @param totalPlays
		 */
		var getReferrers = function getReferrers(totalPlays) {
			EntrySvc.getReferrers($scope.entryId).then (function(data) {
				var objects = data.objects;
				var results = new Array();
				var o;
				for (var i = 0; i<objects.length; i++) {
					o = {
							'domain': objects[i].referrer, 
							'visits': objects[i].plays, 
							'percents' : objects[i].plays / totalPlays
						}; 
					results.push(o);
				}
				$scope.referals = results;
			});
		};
		
		
		/**
		 * get the entry in question
		 */
		var getEntry = function getEntry() {
			return EntrySvc.getEntry($scope.entryId).then(function(entry){
				$scope.entry = entry;
				if (entry.isLive) {
					// live session - show live entry in player
					$scope.playerEntryId = entry.id;
					// set 30 secs update interval
					$scope.intervalPromise = $interval(function() {screenUpdate();}, 30000);
				}
				else if (entry.recordedEntryId && entry.recordedEntryId != '') {
					// session ended, got recording - show recorded entry in player
					$scope.playerEntryId = entry.recordedEntryId;
					//TODO in graph, only show recorded duration (how ??)
				}
				else {
					// show "no recording" in player
					$scope.playerEntryId = -1;
					// set 30 secs update interval
					$scope.intervalPromise = $interval(function() {screenUpdate();}, 30000);
				}
				// set report dates:
				var d = new Date();
				$rootScope.$broadcast('setupScreen', d.getTime());
				d.setTime(entry.createdAt);
				$scope.reportStartTime = d;
				getAggregates(entry.isLive);
				
			});
		};
		
		
		
		var screenSetup = function screenSetup() {
			// report data:
			getEntry();
		};
		
		var screenUpdate = function screenUpdate() {
			var d = new Date();
			var t = d.getTime();
			getAggregates($scope.entry.isLive);
			$rootScope.$broadcast('updateScreen', t);
		};
		
		
		$scope.$on('$destroy', function() {
			// Make sure that the interval is destroyed too
			if (angular.isDefined($scope.intervalPromise)) {
				$interval.cancel(stop);
				$scope.intervalPromise = undefined;
			}
		});
		
		screenSetup();
}]);


