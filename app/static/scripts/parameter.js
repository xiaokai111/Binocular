/**
 * Created by Administrator on 2017/6/16.
 */
$(document).ready(function(){
    $("radio").each(function () {
        if ($(this).prop("checked"))
        {
            $(this).prop("checked", "checked");
        }
    });

});