export type AdministrativeMember = {
  name: string; passport?: string; crm?: string; hospitalRole?: string; specialty?: string; department?: string; joinedAt?: string; history?: string[];
};

export type AdministrativeApplication = {
  name: string; passport?: string; discord?: string; desiredRole?: string; interestArea?: string; createdAt?: string; triageDecision?: string; status?: string; decisionAt?: string; interviewStatus?: string; interviewAt?: string; interviewResult?: string; interviewNotes?: string; notes?: string;
};

export function exportAdministrativeReport(members: AdministrativeMember[], allApplications: AdministrativeApplication[]) {
    const reportDate = new Date();
    const dateLabel = reportDate.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const memberRows = members.map((member) => ({
      Nome: member.name,
      Passaporte: member.passport,
      CRM: member.crm,
      Cargo: member.hospitalRole,
      Especialidade: member.specialty,
      Departamento: member.department,
      "Data de entrada": member.joinedAt,
      Promoções: (member.history || []).filter((entry) => /promov/i.test(entry)).join(" | "),
      Rebaixamentos: (member.history || []).filter((entry) => /rebaix/i.test(entry)).join(" | "),
      "Demissões / desligamentos": (member.history || []).filter((entry) => /demit|deslig/i.test(entry)).join(" | "),
      "Histórico completo": (member.history || []).join(" | "),
    }));

    const applicationRows = allApplications.map((item) => ({
      Nome: item.name,
      Passaporte: item.passport || "",
      Discord: item.discord || "",
      "Cargo pretendido": item.desiredRole,
      "Área de interesse": item.interestArea || "",
      "Data da candidatura": item.createdAt || "",
      "Resultado da triagem": item.triageDecision || (item.status === "Recusado" ? "Recusado" : "Pendente"),
      "Data da decisão": item.decisionAt || "",
      "Situação da entrevista": item.interviewStatus || "Não agendada",
      "Data da entrevista": item.interviewAt || "",
      "Resultado final": item.interviewResult || item.status,
      Observações: item.interviewNotes || item.notes || "",
    }));

    const movementRows = members.flatMap((member) =>
      (member.history || []).map((entry) => ({
        Profissional: member.name,
        Cargo: member.hospitalRole,
        Movimento: /promov/i.test(entry)
          ? "Promoção"
          : /rebaix/i.test(entry)
            ? "Rebaixamento"
            : /demit|deslig/i.test(entry)
              ? "Demissão / desligamento"
              : "Registro administrativo",
        Descrição: entry,
      })),
    );

    const escapeXml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const cell = (value: unknown, style = "Body") =>
      `<Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;

    const numberCell = (value: number, style = "KpiValue") =>
      `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${value}</Data></Cell>`;

    const statusStyle = (value: unknown) => {
      const normalized = String(value ?? "").toLocaleLowerCase("pt-BR");
      if (/contratado|aprovado|realizada|em serviço/.test(normalized) && !/não contratado/.test(normalized)) return "StatusSuccess";
      if (/recusado|não contratado|demit|deslig/.test(normalized)) return "StatusDanger";
      if (/pendente|não agendada|sem resposta|agendada/.test(normalized)) return "StatusWarning";
      return "Body";
    };

    const columnWidth = (header: string) => {
      if (/nome|cargo|especialidade|departamento|área/i.test(header)) return 150;
      if (/histórico|observa|promo|rebaix|demiss|descrição/i.test(header)) return 240;
      if (/data/i.test(header)) return 118;
      if (/situação|resultado|status/i.test(header)) return 135;
      if (/discord|passaporte|crm/i.test(header)) return 105;
      return 125;
    };

    const createDataWorksheet = (name: string, title: string, subtitle: string, rows: Array<Record<string, unknown>>) => {
      const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
      const safeHeaders = headers.length ? headers : ["Informação"];
      const columns = safeHeaders.map((header) => `<Column ss:AutoFitWidth="0" ss:Width="${columnWidth(header)}"/>`).join("");
      const titleRow = `<Row ss:Height="30"><Cell ss:StyleID="SheetTitle" ss:MergeAcross="${Math.max(0, safeHeaders.length - 1)}"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>`;
      const subtitleRow = `<Row ss:Height="24"><Cell ss:StyleID="SheetSubtitle" ss:MergeAcross="${Math.max(0, safeHeaders.length - 1)}"><Data ss:Type="String">${escapeXml(subtitle)}</Data></Cell></Row>`;
      const spacer = `<Row ss:Height="8"/>`;
      const headerRow = `<Row ss:Height="28">${safeHeaders.map((header) => cell(header, "Header")).join("")}</Row>`;
      const dataRows = rows.length
        ? rows.map((row, index) => {
            const baseStyle = index % 2 === 0 ? "Body" : "BodyAlt";
            return `<Row ss:AutoFitHeight="1">${safeHeaders.map((header) => {
              const value = row[header];
              const style = /situação|resultado|status/i.test(header) ? statusStyle(value) : baseStyle;
              return cell(value, style);
            }).join("")}</Row>`;
          }).join("")
        : `<Row><Cell ss:StyleID="Empty" ss:MergeAcross="${Math.max(0, safeHeaders.length - 1)}"><Data ss:Type="String">Nenhum registro disponível.</Data></Cell></Row>`;

      const lastColumn = String.fromCharCode(64 + Math.min(safeHeaders.length, 26));
      const filterRange = `R4C1:R${Math.max(4, rows.length + 4)}C${safeHeaders.length}`;

      return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${columns}${titleRow}${subtitleRow}${spacer}${headerRow}${dataRows}</Table><AutoFilter x:Range="${filterRange}" xmlns="urn:schemas-microsoft-com:office:excel"/><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios><PageSetup><Layout x:Orientation="Landscape"/><Header x:Margin="0.3"/><Footer x:Margin="0.3"/><PageMargins x:Bottom="0.5" x:Left="0.3" x:Right="0.3" x:Top="0.5"/></PageSetup><Print><ValidPrinterInfo/><HorizontalResolution>600</HorizontalResolution><VerticalResolution>600</VerticalResolution></Print></WorksheetOptions></Worksheet>`;
    };

    const pending = allApplications.filter((item) => !item.triageDecision || item.triageDecision === "Pendente").length;
    const approved = allApplications.filter((item) => item.triageDecision === "Aprovado").length;
    const rejected = allApplications.filter((item) => item.triageDecision === "Recusado" || item.status === "Recusado").length;
    const interviews = allApplications.filter((item) => ["Agendada", "Realizada"].includes(item.interviewStatus || "")).length;
    const hired = allApplications.filter((item) => item.interviewResult === "Contratado" || item.status === "Contratado").length;
    const notHired = allApplications.filter((item) => item.interviewResult === "Não contratado" || item.status === "Não contratado").length;
    const noResponse = allApplications.filter((item) => item.interviewStatus === "Sem resposta" || item.status === "Sem resposta").length;

    const statusMetrics = [
      ["Pendentes", pending, "KpiWarning"],
      ["Aprovados na triagem", approved, "KpiSuccess"],
      ["Recusados", rejected, "KpiDanger"],
      ["Entrevistas", interviews, "KpiNeutral"],
      ["Contratados", hired, "KpiSuccess"],
      ["Não contratados", notHired, "KpiDanger"],
      ["Sem resposta", noResponse, "KpiWarning"],
    ] as const;

    const roleCounts = Array.from(
      members.reduce((map, member) => map.set(member.hospitalRole || "Não informado", (map.get(member.hospitalRole || "Não informado") || 0) + 1), new Map<string, number>()),
    ).sort((a, b) => b[1] - a[1]);
    const maxRole = Math.max(1, ...roleCounts.map(([, value]) => value));
    const maxStatus = Math.max(1, ...statusMetrics.map(([, value]) => value));
    const bar = (value: number, max: number) => "■".repeat(Math.max(value ? 1 : 0, Math.round((value / max) * 18)));

    const summaryWorksheet = `<Worksheet ss:Name="Visão geral"><Table>
      <Column ss:Width="175"/><Column ss:Width="90"/><Column ss:Width="210"/><Column ss:Width="24"/><Column ss:Width="175"/><Column ss:Width="90"/><Column ss:Width="210"/>
      <Row ss:Height="34"><Cell ss:StyleID="ReportTitle" ss:MergeAcross="6"><Data ss:Type="String">HOSPITAL SÃO RAFAEL — RELATÓRIO DE GESTÃO ADMINISTRATIVA</Data></Cell></Row>
      <Row ss:Height="26"><Cell ss:StyleID="ReportSubtitle" ss:MergeAcross="6"><Data ss:Type="String">Gerado em ${escapeXml(dateLabel)} · Documento interno e confidencial</Data></Cell></Row>
      <Row ss:Height="10"/>
      <Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="6"><Data ss:Type="String">Indicadores gerais</Data></Cell></Row>
      <Row ss:Height="20"><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Equipe cadastrada</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Candidaturas</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Contratações</Data></Cell><Cell/><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Entrevistas</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Recusados</Data></Cell><Cell ss:StyleID="KpiLabel"><Data ss:Type="String">Sem resposta</Data></Cell></Row>
      <Row ss:Height="32">${numberCell(members.length)}${numberCell(allApplications.length)}${numberCell(hired, "KpiValueSuccess")}<Cell/>${numberCell(interviews)}${numberCell(rejected, "KpiValueDanger")}${numberCell(noResponse, "KpiValueWarning")}</Row>
      <Row ss:Height="12"/>
      <Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="2"><Data ss:Type="String">Fluxo das candidaturas</Data></Cell><Cell/><Cell ss:StyleID="SectionTitle" ss:MergeAcross="2"><Data ss:Type="String">Distribuição da equipe por cargo</Data></Cell></Row>
      ${Array.from({ length: Math.max(statusMetrics.length, roleCounts.length, 1) }, (_, index) => {
        const status = statusMetrics[index];
        const role = roleCounts[index];
        return `<Row ss:Height="23">${status ? `${cell(status[0], "ChartLabel")}${numberCell(status[1], "ChartValue")}${cell(bar(status[1], maxStatus), status[2])}` : `<Cell/><Cell/><Cell/>`}<Cell/>${role ? `${cell(role[0], "ChartLabel")}${numberCell(role[1], "ChartValue")}${cell(bar(role[1], maxRole), "KpiNeutral")}` : `<Cell/><Cell/><Cell/>`}</Row>`;
      }).join("")}
      <Row ss:Height="12"/>
      <Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="6"><Data ss:Type="String">Leitura administrativa</Data></Cell></Row>
      <Row ss:Height="46"><Cell ss:StyleID="Note" ss:MergeAcross="6"><Data ss:Type="String">Use as abas Equipe, Candidaturas e Movimentações para consultar os registros completos. Os cabeçalhos possuem filtros e a primeira linha de dados permanece fixa durante a navegação.</Data></Cell></Row>
    </Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane><ProtectObjects>False</ProtectObjects><ProtectScenarios>False</ProtectScenarios></WorksheetOptions></Worksheet>`;

    const workbookXml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Relatório de Gestão Administrativa</Title><Subject>Equipe e candidaturas do Hospital São Rafael</Subject><Author>Hospital São Rafael</Author><Created>${reportDate.toISOString()}</Created></DocumentProperties><ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel"><WindowHeight>12000</WindowHeight><WindowWidth>22000</WindowWidth><ProtectStructure>False</ProtectStructure><ProtectWindows>False</ProtectWindows></ExcelWorkbook><Styles>
      <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Borders/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#2A211D"/><Interior/><NumberFormat/><Protection/></Style>
      <Style ss:ID="ReportTitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#672614" ss:Pattern="Solid"/></Style>
      <Style ss:ID="ReportSubtitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#6B554A"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/></Style>
      <Style ss:ID="SheetTitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#672614" ss:Pattern="Solid"/></Style>
      <Style ss:ID="SheetSubtitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9" ss:Color="#6B554A"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/></Style>
      <Style ss:ID="SectionTitle"><Alignment ss:Horizontal="Left" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="11" ss:Bold="1" ss:Color="#672614"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
      <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#7A321D" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#542014"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8D4B38"/></Borders></Style>
      <Style ss:ID="Body"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DDD5"/></Borders></Style>
      <Style ss:ID="BodyAlt"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:FontName="Arial" ss:Size="9"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DDD5"/></Borders></Style>
      <Style ss:ID="Empty"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Italic="1" ss:Color="#806B61"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/></Style>
      <Style ss:ID="StatusSuccess"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#17633A"/><Interior ss:Color="#DDF4E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/></Borders></Style>
      <Style ss:ID="StatusDanger"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#A12626"/><Interior ss:Color="#FBE1E1" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/></Borders></Style>
      <Style ss:ID="StatusWarning"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#8A5A00"/><Interior ss:Color="#FFF0C9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/></Borders></Style>
      <Style ss:ID="KpiLabel"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Bold="1" ss:Color="#6B554A"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
      <Style ss:ID="KpiValue"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#672614"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
      <Style ss:ID="KpiValueSuccess"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#17633A"/><Interior ss:Color="#DDF4E6" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9DFC8"/></Borders></Style>
      <Style ss:ID="KpiValueDanger"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#A12626"/><Interior ss:Color="#FBE1E1" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E7BEBE"/></Borders></Style>
      <Style ss:ID="KpiValueWarning"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="16" ss:Bold="1" ss:Color="#8A5A00"/><Interior ss:Color="#FFF0C9" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E9D39C"/></Borders></Style>
      <Style ss:ID="ChartLabel"><Alignment ss:Vertical="Center"/><Font ss:Size="9" ss:Bold="1" ss:Color="#4E3A31"/></Style>
      <Style ss:ID="ChartValue"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#672614"/></Style>
      <Style ss:ID="KpiSuccess"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#268255"/></Style>
      <Style ss:ID="KpiDanger"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#C44848"/></Style>
      <Style ss:ID="KpiWarning"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#C18B22"/></Style>
      <Style ss:ID="KpiNeutral"><Alignment ss:Vertical="Center"/><Font ss:Size="10" ss:Bold="1" ss:Color="#7A321D"/></Style>
      <Style ss:ID="Note"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Color="#6B554A"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9C4B5"/></Borders></Style>
    </Styles>${summaryWorksheet}${createDataWorksheet("Equipe", "Equipe cadastrada", `Profissionais ativos e histórico funcional · Atualizado em ${dateLabel}`, memberRows)}${createDataWorksheet("Candidaturas", "Candidaturas e entrevistas", `Triagem, contato, entrevista e resultado final · Atualizado em ${dateLabel}`, applicationRows)}${createDataWorksheet("Movimentações", "Movimentações administrativas", `Promoções, rebaixamentos, desligamentos e registros internos · Atualizado em ${dateLabel}`, movementRows)}</Workbook>`;

    const blob = new Blob([workbookXml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-gestao-equipe-${reportDate.toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

