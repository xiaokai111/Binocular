/**
 * Created by HS on 2017/7/17.
 */

// 单个规则数据提交到后台
function UpdateRuleEditData(ruleid,model_name,column_name,column_value) {

    //1. 获取当前配置数据
    var data = {
        'ruleid':ruleid,
        'model_name': model_name,
        'column_name': column_name,
        'column_value':column_value
    };
    //2.发送到后端
    $.ajax({
        type: 'POST',
        url: '/UpdateRuleEdit',
        data: data,
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {
        },
        error: function (xhr, type, xxx) {
        }
    });
}



// 一次性提交规则数据到后台
function UpdateRuleEditData1(data) {
    //2.发送到后端
    $.ajax({
        type: 'POST',
        url: '/UpdateRuleEdit1',
        data: data,
        dataType: 'json',
        success: function (data) {
            alert("保存成功！");
            window.location.href="/rule";
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert(errorThrown);
        }
    });
}

