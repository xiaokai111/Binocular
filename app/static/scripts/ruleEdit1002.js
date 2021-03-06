/**
 * Created by HS on 2017/7/13.
 */
//滑动配置
$(".auto_slide").each(function(index,item){
    $(item).slider();
    $(item).slider("setValue",$("#Sensitivity").val());
});

$(".auto_slide").on("change", function (event) {
    $("#Sensitivity").val(event.value.newValue)
});



// 规则等级更改
$('button.RuleEdit').click(function () {
    $('button.RuleEdit').removeClass('btn-success');
    $(this).addClass('btn-success');
    level_value=$(this).val()
    $('#level').val(level_value);
})


// 初始化界面
level=$('#level').val();
$('#btn_'+level).addClass('btn-success');

// 页面上的数据一起提交到后台
$('#sumbit').click(function () {
    // 敏感度
    var  Sensitivity_value=$('#Sensitivity').val();
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
        "Sensitivity":Sensitivity_value
    };
    data=JSON.stringify(data);
    UpdateRuleEditData1(data);
})
