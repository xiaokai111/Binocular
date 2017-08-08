/**
 * Created by HS on 2017/7/18.
 */
/**
 * Created by HS on 2017/7/18.
 */
/**
 * Created by HS on 2017/7/13.
 */

if($('#slider_1').length>0)
{
    $("#slider_1").slider().slider("setValue",$("#Height").val());

    $("#slider_1").on("change", function (event) {
        $("#Height").val(event.value.newValue);
    });
}



//滑动配置
if($('#slider_2').length>0)
{
    $('#slider_2').slider().slider("setValue",$("#RuleDelay").val());

    $("#slider_2").on("change", function (event) {
        $("#RuleDelay").val(event.value.newValue);
    });

}


// 规则等级更改
$('button.RuleEdit').click(function () {
    $('button.RuleEdit').removeClass('btn-success');
    $(this).addClass('btn-success');
    level_value=$(this).val();
    $('#level').val(level_value);
})


// 初始化界面
level=$('#level').val();
$('#btn_'+level).addClass('btn-success');

// 页面上的数据一起提交到后台
$('#sumbit').click(function () {
    // 高度
    var height_value=$('#Height').val();
    //延迟度
    var delay_value=$('#RuleDelay').val();
    // 预制方案
    var Rule_Plan_value=$('#Rule_Plan').val();
    // 报警等级
    var level_value=$('#level').val();

    // 规则id
    var ruleid=$('#ruleid').text();
    var tablename="RuleParameter"+ruleid.substring(0,4);
    var data={
        "ruleid":ruleid,
        "Rule":{
            "Plan":Rule_Plan_value,
            "RuleLevel":level_value
        }
    };
    data[tablename]={
        "RuleDelay":delay_value,
        "Height":height_value
    };
    data=JSON.stringify(data);
    UpdateRuleEditData1(data)
})
