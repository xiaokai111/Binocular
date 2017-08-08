/**
 * Created by Administrator on 2017/6/20.
 */
//滑动配置
$(".auto_slide").each(function(index,item){
    var id=$(item).prop("id");
    var typeId=id.split('_')[1];
    $(item).slider();
    $(item).slider("setValue",$("#input_"+typeId).val());
});

$(".auto_slide").on("change", function (event) {
    var id=$(this).prop("id");
    var typeId=id.split('_')[1];
    $("#input_"+typeId).val(event.value.newValue).trigger("change");
});

//对每个配置，异步后台更新到数据库
$('.NoName').on("change", function () {
    var element=$(this).prop('id').split('_')[0]
    var typeId=$(this).prop('id').split('_')[1];
    var value=$(this).val();
    var remark= $(this).attr('remark');
    Disabled_TimeType(remark);
    //1. 获取当前配置数据
    var data = {
        'typeid': typeId,
        'value': value,
        'element':element
    };
    //2.发送到后端
    $.ajax({
        type: 'POST',
        url: '/preview_Update',
        data: data,
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {
        },
        error: function (xhr, type, xxx) {
        }
    });
});

//radio选择不同，对不同区域的输入框进行可编辑与否
function Disabled_TimeType(name) {
    $('.no_auto').attr('disabled','disabled');
    $('.npt').attr('disabled','disabled');

    if (name=='npt')
    {
        $('.npt').removeAttr('disabled');
    }

    if(name=='no_auto'){
        $('.no_auto').removeAttr('disabled')
    }
}
//初始化时间配置的可编辑状态
radio_value=$("input[type='radio']:checked").val();
if(radio_value==58)
{
    Disabled_TimeType('no_auto');
}

if(radio_value==57)
{
    Disabled_TimeType('npt');
}

//时间控件响应
$('.form_datetime').datetimepicker({
    //language:  'fr',
    weekStart: 1,
    todayBtn:  1,
    autoclose: 1,
    todayHighlight: 1,
    startView: 2,
    forceParse: 0,
    showMeridian: 1
});

$('#myprog').hide();
$('#bdResult').hide();
//标定功能

$('#calibration').click(function () {
    //循环通过后台获取进度值，显示在进度条上，进度条完成，则结束循环
    $('#myprog').show();
    // var st= setTimeout(start_calibration,200);
    start_calibration();
    // st= setTimeout(start_calibration,200);
})

//启动标定
function start_calibration() {
    var st= setTimeout(start_calibration,500);
    $('#calibration').attr('disabled','disabled');
    $.ajax({
        type: 'POST',
        url: '/calibration',
        async: false ,
        data: {},
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {
            current_value=data.current_value;
            current_status=data.status;
            if (current_status == 0) {
                clearTimeout(st);
                //1.按钮显示为重新标定，且进度条重置为0
                $("#calibration").text("重新标定");
                $('#calibration').removeAttr('disabled');
                $("#prog").css("width", "0%").text("等待标定");
                //2.提示出现异常
                alert('标定异常问题')
                return ;
            }

            if (current_value==-1) {

                $('#calibration').removeAttr('disabled');
                clearTimeout(st);
                alert('标定结果图损坏，请重新开始标定.');
                $("#prog").css("width", 0 + "%").text(0 + "%");
                $('#myprog').hide();
                return ;
            }

            if(current_status!=2)
            {
                if(current_value!=100)
                {
                    $("#prog").css("width", current_value + "%").text(current_value + "%");
                }
                else
                {
                    $("#prog").css("width", current_value-1 + "%").text(current_value-1 + "%");
                }

            }
            else
            {
                $("#prog").css("width", 100 + "%").text(100 + "%");
            }

            //进度读取完成时
            if (current_status == 2) {
                $('#calibration').removeAttr('disabled');
                clearTimeout(st);
                $('#test').click();
                setTimeout(function () {
                    alert('标定结果已生成!') ;
                    $('#myprog').hide();
                    $("#prog").css("width", 0 + "%").text(0 + "%");
                },500)
                return ;
            }
        },
        error: function (xhr, type, xxx) {
            console.log('ajax异常')
            return ;
        }

    });
}

//进度条复位函数
function reset( ) {
    $("#prog").css("width","0%").text("等待标定");
}


//查看标定结果
$('#test').click(function () {
    // window.open('ShowPicture','Derek','height=100,width=100,status=yes,toolbar=yes,menubar=no,location=no');
    $('#bdResult').show();
    $.ajax({
        type: 'Get',
        url: '/ShowPicture',
        async: true ,
        data: {},
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {
            imagedata=data.imageData;
            temp='data:image/jpg;base64,'+imagedata;
            $("#bdResult").attr('src',temp);
        },
        error: function (xhr, type, xxx) {

        }
    });
})


//启动画规则图
$('#btnruleImage').click(function () {
    StartThread();
    startRule();
})

