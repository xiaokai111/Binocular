/**
 * Created by HS on 2017/7/11.
 */


//获取当前行的规则id
//ajax，后台更新Rule表的IsActive的值为1，且获取当前规则的通讯状态
//返回状态值，回显在界面
$("input[name='ck_']").click(function () {
    p=$(this).parent();
    p1=p.next('span');
    ruleid=p1.text();
    if(this.checked)
    {

        //更新激活状态为1
        UpdateActiveStatus(ruleid,1);
    }
    else
    {
        // 更新激活状态为0
        UpdateActiveStatus(ruleid,0);
    }
})

// 更新激活状态
function UpdateActiveStatus(ruleid,isActive ) {
    //1. 获取当前配置数据
    var data = {
        'ruleid': ruleid,
        'isActive': isActive
    };

    //2.发送到后端
    $.ajax({
        type: 'POST',
        url: '/updateActiveStatus',
        data: data,
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {

        },
        error: function (xhr, type, xxx) {
        }
    });
}


// 监听规则状态
st=null;
function ListenRuleStatu() {
    $.ajax({
        type: 'GET',
        url: '/ListenRuleStatu',
        data: {},
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        success: function (data) {
           for (x in data){
                // $('#status'+x.toString()).text(data[x])
               console.log(x)
               if(data[x]=='1')
               {

                    $('#status'+x).text('正常工作');

               }
              else {
                     $('#status'+x).text('');
               }
            }
        },
        error: function (xhr, type, xxx) {
        }
    });
    st= setTimeout(ListenRuleStatu,1000);
}

ListenRuleStatu();


