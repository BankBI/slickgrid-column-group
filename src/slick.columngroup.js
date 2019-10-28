(function($) {
    $.extend(true, window, {
        "Slick": {
            "ColumnGroup": ColumnGroup
        }
    });

    function ColumnGroup(frozenColumn) {
        var grid, $container, $groupHeaderColumnsL, $groupHeaderColumnsR, self = this,
            isColumnGroupEnabled = false;
        var handler = new Slick.EventHandler();

        function init(_grid) {
            grid = _grid;
            $container = $(grid.getContainerNode());
            handler.subscribe(grid.onColumnsResized, onColumnsResized);
            handler.subscribe(grid.onColumnsReordered, onColumnsReordered);
        }

        function enableColumnGrouping() {
            if(isColumnGroupEnabled) {
                return;
            }
            isColumnGroupEnabled = true;
            setGroupedColumns();
        }

        function removeColumnGrouping() {
            if(!isColumnGroupEnabled) {
                return;
            }
            isColumnGroupEnabled = false;
            $groupHeaderColumnsL.remove();
            $groupHeaderColumnsR.remove();
            grid.resizeCanvas();
        }

        function setGroupedColumns() {
            var headerColumns = $container.find(".slick-header-columns");
            $groupHeaderColumnsL = $('<div class="slick-group-header-columns ui-state-default"> </div>');
            $groupHeaderColumnsR = $('<div class="slick-group-header-columns ui-state-default"> </div>');
            $groupHeaderColumnsL.css({
                width: headerColumns.width() + "px",
                left: headerColumns.position().left + "px"
            });
            $groupHeaderColumnsR.css({
                width: headerColumns.width() + "px",
                left: headerColumns.position().left + "px"
            });

            var columns = grid.getColumns();
            var columnGroups = getGroupedColumns(columns);
            setGroupIndex(columns);
            setColumnIndex(columns);
			setColumnIndexClasses(columns);

            $groupHeaderColumnsL.append(getGroupedColumnsTemplate(columnGroups, 'L', frozenColumn));
            $groupHeaderColumnsR.append(getGroupedColumnsTemplate(columnGroups, 'R', frozenColumn));
            $container.find(".slick-header.slick-header-right:visible").prepend($groupHeaderColumnsR);
            $container.find(".slick-header.slick-header-left:visible").prepend($groupHeaderColumnsL);

            setupGroupColumnReorder();
            columns.sort(groupCompare);
            grid.setColumns(columns);

            $groupHeaderColumnsL.css('height', 'auto');
            $groupHeaderColumnsR.css('height', 'auto');

            let colGroupHeight = $groupHeaderColumnsL.height();
            if ($groupHeaderColumnsR.height() > colGroupHeight) {
                colGroupHeight = $groupHeaderColumnsR.height();
            }

            $groupHeaderColumnsL.height(colGroupHeight);
            $groupHeaderColumnsR.height(colGroupHeight);

            grid.resizeCanvas();
        }




        function getGroupedColumnsTemplate(columnGroups, side, index) {
            var slickColumns = "";
            $.each(columnGroups, function (name, group) {
                var addColumnGroup = true;

                if (index >= 0) {
                    for (var i = 0; i < group.length; i++) {
                        if (side === 'L' && group[i]._index > index || side === 'R' && group[i]._index <= index) {
                            addColumnGroup = false;
                            break;
                        }
                    }
                }
                
                if (addColumnGroup) {
                    var width = group.reduce(function (width, column) {
                        return width + column.width;
                    }, 0);
                    var displayName = (name === "-") ? " " : name;
                    slickColumns += '<div class="ui-state-default slick-header-column first-in-group" data-group-name="' + name + '"style="width:' + (width) + 'px"> <div class="slick-column-name">' + displayName + '</div></div>';
                }

            });
            return slickColumns;
        }

        function setColumnIndex(columns) {
            columns.forEach(function(column, index) {
                column._index = index;
            });
        }
		
		function setColumnIndexClasses(columns) {
			var usedNames = [];
			var fistInGroupClassName = ' first-in-group ';
			
            columns.forEach(function(column, index) {
				var cssClass = column.cssClass || '';
				
				if(usedNames.indexOf(column.groupName) < 0) {
					if(cssClass.indexOf(fistInGroupClassName) < 0) {
						cssClass += fistInGroupClassName;
					}
					usedNames.push(column.groupName);
				}
				else {
					cssClass = cssClass.replace(/ first-in-group /g, '');
				}
				
				column.headerCssClass = cssClass;
				column.cssClass = cssClass;
            });
        }

        function setGroupIndex(columns) {
            var groupNames = Object.keys(getGroupedColumns(columns));
			
            columns.forEach(function(column) {
				var name = (column.groupName || "-").replace(/'/g, '');
                var index = groupNames.indexOf(name);
                column._groupIndex = index === -1 ? groupNames.length : index;
            });
        }

        function setupGroupColumnReorder() {
            $groupHeaderColumnsL.sortable({
                containment: "parent",
                distance: 3,
                axis: "x",
                cursor: "default",
                tolerance: "intersection",
                helper: "clone",
                update: onColumnsReordered
            });
            $groupHeaderColumnsR.sortable({
                containment: "parent",
                distance: 3,
                axis: "x",
                cursor: "default",
                tolerance: "intersection",
                helper: "clone",
                update: onColumnsReordered
            });
        }

        function onColumnsResized() {
            var columns = grid.getColumns();

            if (!isColumnGroupEnabled) {
                self.onColumnsResized.notify(columns);
                return;
            }

            resizeColumnGroups();
            self.onColumnsResized.notify(columns);
        }

        function fixHeaderHeight() {

            const $paneHeaderL = $(".slick-pane.slick-pane-header.slick-pane-left");
            const $paneHeaderR = $(".slick-pane.slick-pane-header.slick-pane-right");
            const $paneTopL = $(".slick-pane.slick-pane-top.slick-pane-left");
            const $paneTopR = $(".slick-pane.slick-pane-top.slick-pane-right");

            $paneHeaderL.css('height', 'auto');
            $paneHeaderR.css('height', 'auto');

            let headerHeight = $paneHeaderL.height();

            if (frozenColumn > -1 && $paneHeaderR.height() > headerHeight) {
                headerHeight = $paneHeaderR.height();
            }

            $paneHeaderL.css('height', headerHeight);
            $paneHeaderR.css('height', headerHeight);

            var hhh = $(grid.getTopPanel()).height();

            $paneTopL.css({
                'top': headerHeight, 'height': hhh
            });

            if (frozenColumn > -1) {
                $paneTopR.css({
                    'top': headerHeight, 'height': hhh
                });
            }

            const $columnRowL = $paneHeaderL.find('.slick-header-columns');
            const $columnRowR = $paneHeaderR.find('.slick-header-columns');

            $columnRowL.css('height', 'auto');
            $columnRowR.css('height', 'auto');
            let columnRowHeight = $columnRowL.height();

            if (frozenColumn > -1 && $columnRowR.height() > columnRowHeight) {
                columnRowHeight = $columnRowR.height();
            }

            $columnRowL.css('height', columnRowHeight);
            $columnRowR.css('height', columnRowHeight);
        }
	
        function resizeColumnGroups() {
            if (!isColumnGroupEnabled) {
                return;
            }
			var totalWidth = 0;
			var columns = grid.getColumns();
			
			$.each(getGroupedColumns(columns), function(name, group) {
                var width = group.reduce(function(width, column) {
                    return width + column.width;
                }, 0);

                $groupHeaderColumnsL.find("[data-group-name='" + name + "']").css("width", width);
                $groupHeaderColumnsR.find("[data-group-name='" + name + "']").css("width", width);
				totalWidth += width;
            });
            var leftOffset = Math.abs(parseInt($groupHeaderColumnsL.css("left"), 10));
            var leftOffset = Math.abs(parseInt($groupHeaderColumnsR.css("left"), 10));
            $groupHeaderColumnsL.css("width", totalWidth + leftOffset);
            $groupHeaderColumnsR.css("width", totalWidth + leftOffset);

            fixHeaderHeight();
		}

        function onColumnsReordered() {
            var columns = grid.getColumns();
            setColumnIndex(columns);
			setColumnIndexClasses(columns);
			
            if (!isColumnGroupEnabled) {
                self.onColumnsReordered.notify(columns);
                return;
            }

            var $columns = $container.find(".slick-group-header-columns .slick-header-column");
            var columnGroups = getGroupedColumns(columns);
            $columns.each(function(index, column) {
                var groupedColumns = columnGroups[$(column).data("group-name")];
                groupedColumns.forEach(function(groupedColumn) {
                    groupedColumn._groupIndex = index;
                });
            });
            columns.sort(groupCompare);
            grid.setColumns(columns);
            setColumnIndex(columns);
			setColumnIndexClasses(columns);
            self.onColumnsReordered.notify(columns);
        }

        function groupCompare(c1, c2) {
            return (c1._groupIndex - c2._groupIndex) || (c1._index - c2._index);
        }

        function getGroupedColumns(columns) {
            var groupedColumns = {};
            columns.forEach(function(column) {
                var groupName = column.groupName || "-";
				var escaped = groupName.replace(/'/g, '');
				
                groupedColumns[escaped] = groupedColumns[escaped] || [];
                groupedColumns[escaped].push(column);
            });
            return groupedColumns;
        }

        function destroy() {
            handler.unsubscribeAll();
        }

        this.onColumnsReordered = new Slick.Event();
        this.onColumnsResized = new Slick.Event();

        return {
            init: init,
            destroy: destroy,
            onColumnsReordered: this.onColumnsReordered,
            onColumnsResized: this.onColumnsResized,
			triggerColumnResize: resizeColumnGroups,
            enableColumnGrouping: enableColumnGrouping,
            removeColumnGrouping: removeColumnGrouping
        };
    }
}(jQuery));