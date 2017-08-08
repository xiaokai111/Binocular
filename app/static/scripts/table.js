var innerTable = function () {
    //var rowId = undefined;
    var selectRow = undefined;
    var selectRowIndex = undefined;
    var oTable;

    var clearSelect = function () {
        selectRow = undefined;
        selectRowIndex = undefined;
    }

    var initTable = function (tableId, tableRows, aoColumnDefs, url) {
        if (oTable) {
            oTable.fnDestory();
        }
        var defaultColumnDefs = undefined;
        if (aoColumnDefs) {
            defaultColumnDefs = aoColumnDefs;
        }
        else {
            defaultColumnDefs = [{ "aTargets": [0], "sClass": "hidden" }];
        }
        var tableIdTxt = '#' + tableId;
        oTable = $(tableIdTxt).dataTable({
            "language": {
                "sProcessing": "处理中...",
                "sLengthMenu": "每页显示 _MENU_ 项",
                "sZeroRecords": "没有匹配结果",
                "sInfo": "显示第 _START_ 至 _END_ 项，共 _TOTAL_ 项",
                "sInfoEmpty": "显示第 0 至 0 项，共 0 项",
                "sInfoFiltered": "(由 _MAX_ 项过滤)",
                "sInfoPostFix": "",
                "sSearch": "搜索:",
                "sUrl": "",
                "sEmptyTable": "表中数据为空",
                "sLoadingRecords": "正在拼命加载...",
                "sInfoThousands": ",",
                "oPaginate": {
                    "sFirst": "首页",
                    "sPrevious": "上页",
                    "sNext": "下页",
                    "sLast": "末页"
                },
                "oAria": {
                    "sSortAscending": ": 以升序排列此列",
                    "sSortDescending": ": 以降序排列此列"
                },
                "deferRender": true
            },
            "bProcessing": true,
            "bPaginate": true,
            "sPaginationType": "full_numbers",
            'bFilter': false,//关闭搜索
            'bsearch': false,
            "aLengthMenu": [10, 15, 20],
            "iDisplayLength": 10,
            "iDisplayStart": 0,
            'bAutoWidth': true,
            "sAjaxSource": url,
            "aoColumns": tableRows,
            "columnDefs": defaultColumnDefs
        });
        oTable.on('click', 'tr', function () {
            if ($(this).hasClass('selected')) {
                $(this).removeClass('selected');
                clearSelect();
            }
            else {
                oTable.$('tr.selected').removeClass('selected');
                $(this).addClass('selected');
                selectRow = $('td', this);
                selectRowIndex = $(this).context._DT_RowIndex;
            }
        });
    }

    return {
        init: function (tableId, tableRows, aoColumnDefs, url) {
            if (!jQuery().dataTable) {
                return;
            }
            initTable(tableId, tableRows, aoColumnDefs, url);
            return this;
        },
        deleteSelectRow: function () {
            if (selectRowIndex !== undefined) {
                oTable.fnDeleteRow(selectRowIndex);
                clearSelect();
            }
        },
        addRow: function (data) {
            oTable.fnAddData(data, true);
        },
        updateRow: function (data) {
            oTable.fnUpdate(data, selectRowIndex);
        },
        refresh: function (data) {
            oTable.fnClearTable();
            if (data && data.length > 0) {
                oTable.fnAddData(data);
            }
        },
        getRowValue: function (index) {
            if (selectRow) {
                return $(selectRow[index]).text();
            } else {
                return null;
            }

        },
        destroy: function () {
            oTable.fnDestroy();
        }
    };
}();