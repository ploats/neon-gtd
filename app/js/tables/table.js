'use strict';
/*
 * Copyright 2013 Next Century Corporation
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

var tables = tables || {};

/**
 * Creates a new table
 * @class Table
 * @namespace tables
 * @param {String} tableSelector The selector for the component in which the table will be drawn
 * @param {Object} opts A collection of key/value pairs used for configuration parameters:
 * <ul>
 *     <li>data (required) - An array of data to display in the table</li>
 *     <li>columns (optional) - A list of the fields to display in the table. If not specified, the table
 *     will iterate through all of the rows and get the unique column names. This can be a slow operation for
 *     large datasets.</li>
 *     <li>id (optional) - The name of the column with the unique id for the item. If this is not
 *     specified, an id field will be autogenerated and appended to the data (the original data
 *     will be modified)</li>
 *     <li>gridOptions (optional) - Slickgrid options may be set here.
 *     </li>
 * </ul>
 *
 * @constructor
 *
 * @example
 *     var data = [
 *                 {"field1": "aVal", "field2": 2},
 *                 {"field1": "bVal", "field2": 5, "anotherField" : "anotherVal"},
 *                ];
 *     var columns = [
 *                    {name: "field1"},
 *                    {name: "field2"},
 *                    {name: "field3", field: "anotherField", width: 20}
 *                   ];
 *     var opts = { "data" : data, "columns" : columns };
 *     var table = new tables.Table('#table', opts).draw();
 */
tables.Table = function(tableSelector, opts) {
    this.tableSelector_ = tableSelector;
    this.idField_ = opts.id;
    this.options_ = opts.gridOptions || {};

    var data = opts.data;
    var columns = opts.columns ? opts.columns : tables.createColumns(data);

    if(!this.idField_) {
        tables.Table.appendGeneratedId_(data);
        this.idField_ = tables.Table.AUTOGENERATED_ID_FIELD_NAME_;
    }

    this.dataView_ = this.createDataView_(data);
    this.columns_ = tables.Table.createSlickgridColumns_(columns);
    this.sortInfo_ = {};
};

tables.Table.AUTOGENERATED_ID_FIELD_NAME_ = '__autogenerated_id';

/**
 * Creates an array of objects containing the column names by iterating through the data and saving unique column names.
 * @param {Array} data The data being shown in the table
 * @return {Array} The objects containing column names
 * @method createColumns
 * @private
 */
tables.createColumns = function(data) {
    // just use an object to store the keys for faster lookup (basically a hash where we don't care about the value)
    var map = {};
    data.forEach(function(row) {
        var keys = Object.keys(row);
        keys.forEach(function(key) {
            map[key] = true;
        });
    });

    var columns = [];
    Object.keys(map).forEach(function(name) {
        columns.push({
            name: name
        });
    });
    return columns;
};

/**
 * Creates the sort comparator to sort the data in the table
 * @param {String} field The field being sorted
 * @param {Boolean} sortAsc Whether to sort ascending
 * @return {Function} A function to perform the sort comparison
 * @method sortComparator_
 * @private
 */
tables.Table.sortComparator_ = function(field, sortAsc) {
    return function(a, b) {
        var result = 0;
        if(a[field] > b[field]) {
            result = 1;
        } else if(a[field] < b[field]) {
            result = -1;
        }
        return sortAsc ? result : -result;
    };
};

tables.Table.appendGeneratedId_ = function(data) {
    var id = 0;
    data.forEach(function(el) {
        el[tables.Table.AUTOGENERATED_ID_FIELD_NAME_] = id++;
    });
};

/**
 * Creates a slickgrid data view from the raw data
 * @param {Array} data Array of data to be displayed
 * @method createDataView_
 * @private
 */
tables.Table.prototype.createDataView_ = function(data) {
    var dataView = new Slick.Data.DataView();
    dataView.setItems(data, this.idField_);

    return dataView;
};

/**
 * Converts a list of column names to the format required by the slickgrids library
 * used to create the tables
 * @param {Array} columnNames A list of column names
 * @method createSlickgridColumns_
 * @private
 */
tables.Table.createSlickgridColumns_ = function(columnNames) {
    var slickgridColumns = [];
    columnNames.forEach(function(column) {
        var slickgridColumn = {};
        slickgridColumn.id = column.name;
        slickgridColumn.name = column.name;
        slickgridColumn.field = column.field ? column.field : column.name;
        slickgridColumn.focusable = true;
        slickgridColumn.sortable = true;
        slickgridColumn.formatter = tables.Table.defaultCellFormatter_;
        if(column.width) {
            slickgridColumn.width = column.width;
        }
        if(column.cssClass) {
            slickgridColumn.cssClass = column.cssClass;
        }
        if(column.ignoreClicks) {
            // This column and its cells will not become "active" on click.
            slickgridColumn.focusable = false;
        }
        slickgridColumns.push(slickgridColumn);
    });
    return slickgridColumns;
};

tables.Table.defaultCellFormatter_ = function(row, cell, value, columnDef, dataContext) {
    // most of this taken from slick.grid.js defaultFormatter but modified to support nested objects
    if(null === value || undefined === value) {
        return "";
    }

    // check if nested object. if it is, append each of the key/value pairs
    var keys = tables.Table.getObjectKeys_(value);

    if(0 === keys.length) {
        return value;
    }

    return tables.Table.createKeyValuePairsString_(value, keys, row, cell, columnDef, dataContext);
};

tables.Table.getObjectKeys_ = function(object) {
    var keys = [];
    if('object' === typeof object) {
        keys = Object.keys(object);
    }
    return keys;
};

tables.Table.createKeyValuePairsString_ = function(object, keys, row, cell, columnDef, dataContext) {
    var keyValueStrings = [];
    keys.forEach(function(key) {
        keyValueStrings.push(key + ': ' + tables.Table.defaultCellFormatter_(row, cell, object[key], columnDef, dataContext));
    });
    return keyValueStrings.join(', ');
};

/**
 * Draws the table in the selector specified in the constructor
 * @method draw
 * @return {tables.Table} This table
 */
tables.Table.prototype.draw = function() {
    this.table_ = new Slick.Grid(this.tableSelector_, this.dataView_, this.columns_, this.options_);
    this.addSortSupport_();
    this.table_.registerPlugin(new Slick.AutoTooltips({
        enableForHeaderCells: true
    }));

    // Setup some event loggers.
    this.table_.onColumnsResized.subscribe(function() {
        XDATA.activityLogger.logUserActivity('Grid - user resized columns', 'resize',
            XDATA.activityLogger.WF_EXPLORE);
    });

    // Setup some event loggers.
    this.table_.onColumnsReordered.subscribe(function() {
        XDATA.activityLogger.logUserActivity('Grid - user reordered columns', 'reorder',
            XDATA.activityLogger.WF_EXPLORE);
    });

    // Setup some event loggers.
    this.table_.onScroll.subscribe(function() {
        XDATA.activityLogger.logUserActivity('Grid - user scrolled data view', 'scroll',
            XDATA.activityLogger.WF_EXPLORE);
    });

    // Setup some event loggers.
    this.table_.onSort.subscribe(function(e, args) {
        XDATA.activityLogger.logUserActivity('Grid - user sorted column', 'sort',
            XDATA.activityLogger.WF_EXPLORE, {
                column: args.sortCol.field,
                sortAsc: args.sortAsc,
                multicolumnSort: args.multiColumnSort
            });
    });

    return this;
};

tables.Table.prototype.refreshLayout = function() {
    // the table may not be drawn yet when this is called (this method can be used as a hook to resize a table, but
    // if the browser is resized before the table is drawn, the table will be undefined here)
    if(this.table_) {
        this.table_.resizeCanvas();
    }
};

tables.Table.prototype.registerSelectionListener = function(callback) {
    if(!callback || 'function' !== typeof callback) {
        return;
    }
    var rowModel = new Slick.RowSelectionModel();
    this.table_.setSelectionModel(rowModel);

    var me = this;
    rowModel.onSelectedRangesChanged.subscribe(function() {
        if(me.idField_ === tables.Table.AUTOGENERATED_ID_FIELD_NAME_) {
            return;
        }

        var selectedRowData = [];
        _.each(me.table_.getSelectedRows(), function(rowIndex) {
            selectedRowData.push(me.table_.getDataItem(rowIndex));
        });
        callback(me.idField_, selectedRowData);
    });
    return this;
};

tables.Table.prototype.sortColumn = function(field, sortAsc) {
    var data = this.dataView_.getItems();
    // Use a stable sorting algorithm as opposed to the built-in
    // dataView sort which may not be stable.
    data = data.mergeSort(tables.Table.sortComparator_(field, sortAsc));
    this.dataView_.setItems(data);
    this.table_.invalidateAllRows();
    this.table_.render();
    this.sortInfo_ = { field: field, sortAsc: sortAsc };
};

tables.Table.prototype.addSortSupport_ = function() {
    var me = this;
    this.table_.onSort.subscribe(function(event, args) {
        me.sortColumn(args.sortCol.field, args.sortAsc);
    });
};

tables.Table.prototype.sortColumnAndChangeGlyph = function(sortInfo) {
    // Sort the data in the column.
    this.sortColumn(sortInfo.field, sortInfo.sortAsc);
    // Change the sort glyph in the column header.
    this.table_.setSortColumn(sortInfo.field, sortInfo.sortAsc);
};

/**
 * Adds an onClick listener to the SlickGrid table using the given callback with
 * arguments for the array of column definitions and the selected row object.
 * @param {Function} The callback function
 */
tables.Table.prototype.addOnClickListener = function(callback) {
    var me = this;
    this.table_.onClick.subscribe(function(event, args) {
        if(me.columns_[args.cell].focusable) {
            callback(me.table_.getColumns(), me.dataView_.getItem(args.row));
        }
    });
};

/**
 * Deselects the active elements in the table.
 */
tables.Table.prototype.deselect = function() {
    this.table_.resetActiveCell();
};

/**
 * Sets the active cell in this table to the column and row containing the given
 * field and value, if it exists.
 * @param {String} The field matching a column name
 * @param {String} The value matching a cell's text
 */
tables.Table.prototype.setActiveCellIfMatchExists = function(field, value) {
    for(var i = 0; i < this.columns_.length; ++i) {
        if(this.columns_[i].field === field) {
            for(var j = 0; j < this.table_.getDataLength(); ++j) {
                if(this.table_.getCellNode(j, i).innerHTML === value) {
                    this.table_.setActiveCell(j, i);
                }
            }
        }
    }
};
